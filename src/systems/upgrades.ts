import type { UnitStats } from '../types';
import { storageGet, storageSet } from './storage';
import { weaponUpgradeCost } from './weapons';

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
        clearedMax?: number;
        lastDaily?: number;
        streak?: number;
        lastSeen?: number;
      };
      this.gold = obj.gold ?? 0;
      this.levels = obj.levels ?? {};
      this.weaponLevels = obj.weaponLevels ?? {};
      this.clearedMax = obj.clearedMax ?? 0;
      this.lastDaily = obj.lastDaily ?? -1;
      this.streak = obj.streak ?? 0;
      this.lastSeen = obj.lastSeen ?? 0;
    } catch {
      /* ignore */
    }
  }

  private save(): void {
    storageSet(
      KEY,
      JSON.stringify({
        gold: this.gold,
        levels: this.levels,
        weaponLevels: this.weaponLevels,
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
