/** 특수 무기(게이지가 차면 발사) — 순수 로직, Vitest 검증 */

export type WeaponKey =
  | 'meteor'
  | 'arrows'
  | 'lightning'
  | 'heal'
  | 'shockwave'
  | 'freeze'
  | 'guard'
  | 'berserk'
  | 'snipe';

export interface WeaponDef {
  key: WeaponKey;
  name: string;
  icon: string;
  desc: string;
  chargeSec: number; // 게이지가 가득 차는 데 걸리는 시간(초)
  color: number; // 게이지 색
}

/** 순서 = 해금 순서(스테이지 N에서 N번째 무기까지) = 단축키 1~9 */
export const WEAPONS: WeaponDef[] = [
  { key: 'meteor', name: '메테오', icon: '🔥', desc: '앞쪽 적 무리 범위 피해', chargeSec: 20, color: 0xff7a3c },
  { key: 'arrows', name: '화살비', icon: '🏹', desc: '모든 적에게 피해', chargeSec: 22, color: 0xc8e06a },
  { key: 'lightning', name: '번개', icon: '⚡', desc: '가까운 적 5마리 큰 피해', chargeSec: 25, color: 0xffe14d },
  { key: 'heal', name: '치유', icon: '💚', desc: '아군 HP 50%·기지 15% 회복', chargeSec: 25, color: 0x5cff9e },
  { key: 'shockwave', name: '충격파', icon: '💣', desc: '앞쪽 적을 밀어내고 피해', chargeSec: 28, color: 0xffa94d },
  { key: 'freeze', name: '빙결', icon: '❄️', desc: '모든 적 정지', chargeSec: 30, color: 0x7cd8ff },
  { key: 'guard', name: '수호', icon: '🛡️', desc: '아군 무적', chargeSec: 35, color: 0x9ab4ff },
  { key: 'berserk', name: '광폭', icon: '⚔️', desc: '아군 공격력·공격속도 증가', chargeSec: 35, color: 0xff5a6e },
  { key: 'snipe', name: '저격', icon: '🎯', desc: 'HP가 가장 많은 적 1명 큰 피해', chargeSec: 40, color: 0xd58cff },
];

/** 무기별 수치 */
export const METEOR_DAMAGE = 220;
export const METEOR_RADIUS = 110; // 착탄 지점 ±px
export const ARROWS_DAMAGE = 70;
export const LIGHTNING_TARGETS = 5;
export const LIGHTNING_DAMAGE = 180;
export const HEAL_UNIT_RATIO = 0.5;
export const HEAL_BASE_RATIO = 0.15;
export const SHOCKWAVE_RANGE = 300; // 맨 앞 적에서 이 거리 안의 적만
export const SHOCKWAVE_PUSH = 160;
export const SHOCKWAVE_DAMAGE = 60;
export const FREEZE_SEC = 3.5;
export const GUARD_SEC = 4;
export const BERSERK_SEC = 6;
export const BERSERK_ATK = 1.5;
export const BERSERK_COOLDOWN = 0.5; // 공격 간격 배수(작을수록 빠름)
export const SNIPE_DAMAGE = 600;

/** 🔧 특수 무기 영구 강화(메타 골드) — 레벨당 위력 +15%, 충전 시간 -6%(최대 50% 단축), 지속시간 +8% */
export function weaponPowerMult(lv: number): number {
  return 1 + 0.15 * lv;
}

export function weaponChargeMult(lv: number): number {
  return Math.max(0.5, 1 - 0.06 * lv);
}

export function weaponDurationMult(lv: number): number {
  return 1 + 0.08 * lv;
}

/** 레벨 N → 다음 레벨 강화 비용 */
export function weaponUpgradeCost(lv: number): number {
  return 150 + 100 * lv;
}

/** 스테이지 id에서 쓸 수 있는 무기 수 — 스테이지 N이면 N개(최대 9) */
export function unlockedWeapons(stageId: number): number {
  return Math.max(1, Math.min(WEAPONS.length, stageId));
}

/** 게이지 — 시간 경과로 0→1, 가득 차면 발사 가능, 발사하면 0부터 다시 */
export class WeaponCharge {
  private value = 0;

  constructor(private readonly chargeSec: number) {}

  update(dt: number): void {
    if (this.chargeSec <= 0) {
      this.value = 1;
      return;
    }
    this.value = Math.min(1, this.value + dt / this.chargeSec);
  }

  get ratio(): number {
    return this.value;
  }

  get ready(): boolean {
    return this.value >= 1;
  }

  /** 발사 시도 — 가득 찼으면 비우고 true */
  fire(): boolean {
    if (!this.ready) return false;
    this.value = 0;
    return true;
  }
}

/** 메테오 착탄 지점 — 우리 기지에 가장 가까운 적 무리의 평균 위치 */
export function meteorTarget(enemyXs: number[], radius = METEOR_RADIUS): number | null {
  if (enemyXs.length === 0) return null;
  const front = Math.min(...enemyXs);
  const near = enemyXs.filter((x) => x - front <= radius * 2);
  return near.reduce((a, b) => a + b, 0) / near.length;
}

/** 번개 대상 — 우리 기지(왼쪽)에 가까운 순서로 n개의 인덱스 */
export function lightningTargets(enemyXs: number[], n = LIGHTNING_TARGETS): number[] {
  return enemyXs
    .map((x, i) => ({ x, i }))
    .sort((a, b) => a.x - b.x)
    .slice(0, n)
    .map((e) => e.i);
}

/** 저격 대상 — 현재 HP가 가장 많은 적의 인덱스(없으면 -1) */
export function snipeTarget(enemyHps: number[]): number {
  let best = -1;
  for (let i = 0; i < enemyHps.length; i++) if (best < 0 || enemyHps[i] > enemyHps[best]) best = i;
  return best;
}
