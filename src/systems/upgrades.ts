import type { UnitStats } from '../types';
import { storageGet, storageSet } from './storage';
import { weaponUpgradeCost } from './weapons';
import { STARTER_UNIT, STARTER_WEAPON, migrateOwned } from './unlocks';
import { addStats, dailyMissions, type Mission, type Stats } from './missions';
import { pushRecord, type EndlessRecord } from './endless';
import { BASE_MAX_LV, baseUpgradeCost, type BaseKey } from './baseUpgrades';
import { timeRecord } from './pacing';

/** 강화 순수 계산 (Vitest 검증) */

/** 레벨 N → 다음 레벨 강화 비용(메타 골드) */
export function upgradeCost(level: number): number {
  return 100 + level * 80;
}

/** 레벨당 +15% (반올림) */
export function scaleStat(base: number, level: number): number {
  return Math.round(base * (1 + level * 0.15));
}

/** 유닛 스탯에 강화 레벨 적용(hp·atk 상승) */
export function applyUpgrade(stats: UnitStats, level: number): UnitStats {
  if (level <= 0) return stats;
  return { ...stats, hp: scaleStat(stats.hp, level), atk: scaleStat(stats.atk, level) };
}

/** 일일 보상 금액(연속 출석 streak 반영, day1=50 → 7일+ 200 캡) */
export function dailyAmount(streak: number): number {
  return 50 + Math.min(streak, 6) * 25;
}

/** 방치(오프라인) 보상 — 경과시간 × 시간당, 상한 캡 */
export function idleAmount(elapsedMs: number, goldPerHour: number, capHours: number): number {
  const ms = Math.min(Math.max(0, elapsedMs), capHours * 3600_000);
  return Math.floor((ms / 3600_000) * goldPerHour);
}

/** 현지 자정 기준 날짜 index — tzOffsetMin은 Date#getTimezoneOffset() 값(KST=-540) */
export function localDayIndex(nowMs: number, tzOffsetMin: number): number {
  return Math.floor((nowMs - tzOffsetMin * 60_000) / 86_400_000);
}

const IDLE_PER_HOUR = 60;
const IDLE_CAP_HOURS = 8;

/**
 * 메타 진행도(영구) — 유닛 레벨 + 메타 골드.
 * 저장은 storage.ts 통해 네이티브=Preferences / 웹=localStorage 자동 선택.
 * 상태는 메모리에 동기 유지, init()로 1회 비동기 로드(Boot에서 await).
 */
const KEY = 'ld_meta_v1';

export class MetaProgress {
  gold = 0;
  levels: Record<string, number> = {};
  weaponLevels: Record<string, number> = {}; // 특수 무기 영구 강화 레벨
  baseLevels: Record<string, number> = {}; // 🏰 기지 강화(인구·소환) 레벨
  heroLevels: Record<string, number> = {}; // 👑 영웅 강화(hero·aura·스킬별 위력)
  heroOwned: string[] = ['mace']; // 👑 해금한 영웅 스킬
  stars: Record<string, number> = {}; // 스테이지별 최고 별(1~3)
  bestTimes: Record<string, number> = {}; // ⏱️ 스테이지별 최단 클리어 시간(초)
  ownedUnits: string[] = [STARTER_UNIT]; // 구매한 유닛
  ownedWeapons: string[] = [STARTER_WEAPON]; // 구매한 특수 무기
  totals: Stats = {}; // 업적용 누적 기록
  daily: { day: number; stats: Stats; claimed: string[] } = { day: -1, stats: {}, claimed: [] }; // 오늘 미션 진행
  achClaimed: string[] = []; // 받은 업적
  endlessTop: EndlessRecord[] = []; // ♾️ 무한 모드 명예의 전당(상위 5)
  skinsOwned: string[] = []; // 👗 보유 스킨 '유닛:스킨'
  skinEquipped: Record<string, string> = {}; // 유닛별 착용 스킨
  clearedMax = 0; // 클리어한 최고 스테이지 id
  lastDaily = -1; // 마지막 일일보상 수령 day index
  streak = 0; // 연속 출석
  lastSeen = 0; // 마지막 접속(ms) — 방치 보상 기준
  private ready = false;

  /** 저장소에서 1회 로드(Boot에서 await). 비동기 저장소 대응. */
  async init(): Promise<void> {
    if (this.ready) return;
    const raw = await storageGet(KEY);
    this.parse(raw);
    if (this.lastSeen === 0) this.lastSeen = Date.now();
    this.ready = true;
    this.save();
  }

  private dayIndex(): number {
    const now = new Date();
    return localDayIndex(now.getTime(), now.getTimezoneOffset());
  }

  /** 오늘 일일보상 받을 수 있나 */
  canClaimDaily(): boolean {
    return this.dayIndex() > this.lastDaily;
  }

  /** 출석 며칠째인지(1부터) — 받을 차례면 오늘 받을 날, 받았으면 오늘 받은 날 */
  dailyDayNumber(): number {
    if (!this.canClaimDaily()) return this.streak + 1;
    const consecutive = this.lastDaily >= 0 && this.dayIndex() === this.lastDaily + 1;
    return consecutive ? this.streak + 2 : 1;
  }

  /** 일일보상 수령 → 금액 반환(0=이미 받음) */
  claimDaily(): number {
    if (!this.canClaimDaily()) return 0;
    const consecutive = this.lastDaily >= 0 && this.dayIndex() === this.lastDaily + 1;
    this.streak = consecutive ? this.streak + 1 : 0;
    this.lastDaily = this.dayIndex();
    const amt = dailyAmount(this.streak);
    this.gold += amt;
    this.save();
    return amt;
  }

  /** 방치 보상 대기 금액(미수령분) */
  pendingIdle(): number {
    return idleAmount(Date.now() - this.lastSeen, IDLE_PER_HOUR, IDLE_CAP_HOURS);
  }

  /** 방치 보상 수령 → 금액 반환, 타이머 리셋 */
  claimIdle(): number {
    const amt = this.pendingIdle();
    if (amt > 0) this.gold += amt;
    this.lastSeen = Date.now();
    this.save();
    return amt;
  }

  /** 스테이지 잠금 해제 여부 — 1관문은 항상 열림, 그 외는 직전 스테이지 클리어 필요 */
  isUnlocked(id: number): boolean {
    return id <= this.clearedMax + 1;
  }

  clearStage(id: number): void {
    if (id > this.clearedMax) {
      this.clearedMax = id;
      this.save();
    }
  }

  level(type: string): number {
    return this.levels[type] ?? 0;
  }

  nextCost(type: string): number {
    return upgradeCost(this.level(type));
  }

  canUpgrade(type: string): boolean {
    return this.gold >= this.nextCost(type);
  }

  upgrade(type: string): boolean {
    const cost = this.nextCost(type);
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.levels[type] = this.level(type) + 1;
    this.save();
    return true;
  }

  ownsUnit(key: string): boolean {
    return this.ownedUnits.includes(key);
  }

  ownsWeapon(key: string): boolean {
    return this.ownedWeapons.includes(key);
  }

  /** 🛒 구매 — 골드 차감 후 보유 목록에 추가 */
  buyUnit(key: string, price: number): boolean {
    if (this.ownsUnit(key) || this.gold < price) return false;
    this.gold -= price;
    this.ownedUnits.push(key);
    this.save();
    return true;
  }

  buyWeapon(key: string, price: number): boolean {
    if (this.ownsWeapon(key) || this.gold < price) return false;
    this.gold -= price;
    this.ownedWeapons.push(key);
    this.save();
    return true;
  }

  /** 📋 전투 기록 반영(판 끝날 때 한 번) — 날짜가 바뀌었으면 오늘 기록 초기화 */
  addRunStats(run: Stats): void {
    this.rollDaily();
    this.totals = addStats(this.totals, run);
    this.daily.stats = addStats(this.daily.stats, run);
    this.save();
  }

  private rollDaily(): void {
    const d = this.dayIndex();
    if (this.daily.day !== d) this.daily = { day: d, stats: {}, claimed: [] };
  }

  todayMissions(): Mission[] {
    return dailyMissions(this.dayIndex());
  }

  /** 미션/업적 진행도 */
  progress(m: Mission, kind: 'daily' | 'ach'): number {
    this.rollDaily();
    const src = kind === 'daily' ? this.daily.stats : m.stat === 'stars' ? { stars: this.totalStars } : this.totals;
    return Math.min(m.goal, src[m.stat] ?? 0);
  }

  isClaimed(m: Mission, kind: 'daily' | 'ach'): boolean {
    return (kind === 'daily' ? this.daily.claimed : this.achClaimed).includes(m.key);
  }

  /** 보상 받기 — 받은 골드(0 = 불가) */
  claimMission(m: Mission, kind: 'daily' | 'ach'): number {
    if (this.isClaimed(m, kind) || this.progress(m, kind) < m.goal) return 0;
    (kind === 'daily' ? this.daily.claimed : this.achClaimed).push(m.key);
    this.gold += m.reward;
    this.save();
    return m.reward;
  }

  /** 받을 수 있는 미션/업적이 있나(메뉴 뱃지) */
  hasClaimable(achievements: Mission[]): boolean {
    return (
      this.todayMissions().some((m) => !this.isClaimed(m, 'daily') && this.progress(m, 'daily') >= m.goal) ||
      achievements.some((m) => !this.isClaimed(m, 'ach') && this.progress(m, 'ach') >= m.goal)
    );
  }

  ownsSkin(type: string, skin: string): boolean {
    return this.skinsOwned.includes(`${type}:${skin}`);
  }

  equippedSkin(type: string): string | null {
    return this.skinEquipped[type] ?? null;
  }

  buySkin(type: string, skin: string, price: number): boolean {
    if (this.ownsSkin(type, skin) || this.gold < price) return false;
    this.gold -= price;
    this.skinsOwned.push(`${type}:${skin}`);
    this.skinEquipped[type] = skin; // 사면 바로 착용
    this.save();
    return true;
  }

  /** 착용 — null이면 기본 복장 */
  equipSkin(type: string, skin: string | null): void {
    if (skin === null) delete this.skinEquipped[type];
    else if (this.ownsSkin(type, skin)) this.skinEquipped[type] = skin;
    else return;
    this.save();
  }

  get endlessBest(): number {
    return this.endlessTop[0]?.wave ?? 0;
  }

  /** 무한 모드 기록 → 신기록이면 true */
  recordEndless(wave: number): boolean {
    const [list, isBest] = pushRecord(this.endlessTop, wave, Date.now());
    this.endlessTop = list;
    this.save();
    return isBest;
  }

  starsOf(stageId: number): number {
    return this.stars[String(stageId)] ?? 0;
  }

  get totalStars(): number {
    return Object.values(this.stars).reduce((a, b) => a + b, 0);
  }

  /** 별 기록 갱신 → 새로 얻은 별 수 */
  recordStars(stageId: number, got: number): number {
    const prev = this.starsOf(stageId);
    if (got <= prev) return 0;
    this.stars[String(stageId)] = got;
    this.save();
    return got - prev;
  }

  weaponLevel(key: string): number {
    return this.weaponLevels[key] ?? 0;
  }

  weaponNextCost(key: string): number {
    return weaponUpgradeCost(this.weaponLevel(key));
  }

  upgradeWeapon(key: string): boolean {
    const cost = this.weaponNextCost(key);
    if (this.gold < cost) return false;
    this.gold -= cost;
    this.weaponLevels[key] = this.weaponLevel(key) + 1;
    this.save();
    return true;
  }

  heroLevel(key: string): number {
    return this.heroLevels[key] ?? 0;
  }

  ownsHeroSkill(key: string): boolean {
    return this.heroOwned.includes(key);
  }

  /** 👑 영웅 스킬 해금 */
  buyHeroSkill(key: string, price: number): boolean {
    if (this.ownsHeroSkill(key) || this.gold < price) return false;
    this.gold -= price;
    this.heroOwned.push(key);
    this.save();
    return true;
  }

  /** 👑 영웅 강화 한 단계(최대 레벨이면 실패) */
  upgradeHero(key: string, cost: number, max: number): boolean {
    if (this.heroLevel(key) >= max || this.gold < cost) return false;
    this.gold -= cost;
    this.heroLevels[key] = this.heroLevel(key) + 1;
    this.save();
    return true;
  }

  baseLevel(key: BaseKey): number {
    return this.baseLevels[key] ?? 0;
  }

  /** 🏰 기지 강화 다음 비용(최대 레벨이면 null) */
  baseNextCost(key: BaseKey): number | null {
    const lv = this.baseLevel(key);
    return lv >= BASE_MAX_LV ? null : baseUpgradeCost(lv);
  }

  upgradeBase(key: BaseKey): boolean {
    const cost = this.baseNextCost(key);
    if (cost === null || this.gold < cost) return false;
    this.gold -= cost;
    this.baseLevels[key] = this.baseLevel(key) + 1;
    this.save();
    return true;
  }

  /** ⏱️ 클리어 시간 기록 → 'first'(첫 기록) / 'best'(신기록) / null */
  recordTime(stageId: number, sec: number): 'first' | 'best' | null {
    const r = timeRecord(this.bestTimes[stageId], sec);
    if (r) {
      this.bestTimes[stageId] = sec;
      this.save();
    }
    return r;
  }

  addGold(amount: number): void {
    this.gold += amount;
    this.save();
  }

  private parse(raw: string | null): void {
    if (!raw) return;
    try {
      const obj = JSON.parse(raw) as {
        gold?: number;
        levels?: Record<string, number>;
        weaponLevels?: Record<string, number>;
        baseLevels?: Record<string, number>;
        heroLevels?: Record<string, number>;
        heroOwned?: string[];
        stars?: Record<string, number>;
        bestTimes?: Record<string, number>;
        ownedUnits?: string[];
        ownedWeapons?: string[];
        totals?: Stats;
        daily?: { day: number; stats: Stats; claimed: string[] };
        achClaimed?: string[];
        endlessTop?: EndlessRecord[];
        skinsOwned?: string[];
        skinEquipped?: Record<string, string>;
        clearedMax?: number;
        lastDaily?: number;
        streak?: number;
        lastSeen?: number;
      };
      this.gold = obj.gold ?? 0;
      this.levels = obj.levels ?? {};
      this.weaponLevels = obj.weaponLevels ?? {};
      this.baseLevels = obj.baseLevels ?? {};
      this.heroLevels = obj.heroLevels ?? {};
      this.heroOwned = obj.heroOwned ?? ['mace'];
      this.stars = obj.stars ?? {};
      this.bestTimes = obj.bestTimes ?? {};
      this.ownedUnits = obj.ownedUnits ?? migrateOwned(STARTER_UNIT, this.levels);
      this.ownedWeapons = obj.ownedWeapons ?? migrateOwned(STARTER_WEAPON, this.weaponLevels);
      this.totals = obj.totals ?? {};
      this.daily = obj.daily ?? { day: -1, stats: {}, claimed: [] };
      this.achClaimed = obj.achClaimed ?? [];
      this.endlessTop = obj.endlessTop ?? [];
      this.skinsOwned = obj.skinsOwned ?? [];
      this.skinEquipped = obj.skinEquipped ?? {};
      this.clearedMax = obj.clearedMax ?? 0;
      this.lastDaily = obj.lastDaily ?? -1;
      this.streak = obj.streak ?? 0;
      this.lastSeen = obj.lastSeen ?? 0;
    } catch {
      /* ignore */
    }
  }

  /** 🛠️ 개발자 모드 — 값을 직접 바꾼 뒤 저장 */
  devEdit(fn: (m: MetaProgress) => void): void {
    fn(this);
    this.save();
  }

  /** 🛠️ 개발자 모드 — 저장 전부 초기화(처음 설치한 상태) */
  devReset(): void {
    const fresh = new MetaProgress();
    const keep = { ready: true };
    Object.assign(this, fresh, keep);
    this.lastSeen = Date.now();
    this.save();
  }

  private save(): void {
    storageSet(
      KEY,
      JSON.stringify({
        gold: this.gold,
        levels: this.levels,
        weaponLevels: this.weaponLevels,
        baseLevels: this.baseLevels,
        heroLevels: this.heroLevels,
        heroOwned: this.heroOwned,
        stars: this.stars,
        bestTimes: this.bestTimes,
        ownedUnits: this.ownedUnits,
        ownedWeapons: this.ownedWeapons,
        totals: this.totals,
        daily: this.daily,
        achClaimed: this.achClaimed,
        endlessTop: this.endlessTop,
        skinsOwned: this.skinsOwned,
        skinEquipped: this.skinEquipped,
        clearedMax: this.clearedMax,
        lastDaily: this.lastDaily,
        streak: this.streak,
        lastSeen: this.lastSeen,
      })
    );
  }
}

/** 전역 싱글턴 */
export const meta = new MetaProgress();
