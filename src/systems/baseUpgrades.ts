/** 🏰 기지 강화(영구) — 인구 상한 · 소환 에너지. 순수 계산(Vitest 검증) */

export type BaseKey = 'pop' | 'energy';

export const BASE_MAX_LV = 10;
export const FOOD_BASE = 40; // 기본 최대 인구
export const ENERGY_RATE = 9; // 기본 에너지 충전(초당)
export const ENERGY_MAX = 100; // 기본 에너지 상한

export interface BaseUpgrade {
  key: BaseKey;
  name: string;
  icon: string;
  /** 레벨 lv일 때 효과 설명 */
  effect: (lv: number) => string;
}

/** 최대 인구 보너스 — 레벨당 +5 */
export function popBonus(lv: number): number {
  return 5 * lv;
}

/** 소환 에너지 충전 속도 — 레벨당 초당 +1 */
export function energyRate(lv: number): number {
  return ENERGY_RATE + lv;
}

/** 소환 에너지 상한 — 레벨당 +10 */
export function energyMax(lv: number): number {
  return ENERGY_MAX + 10 * lv;
}

/** 레벨 N → 다음 레벨 비용(골드) */
export function baseUpgradeCost(lv: number): number {
  return 150 + lv * 120;
}

export const BASE_UPGRADES: BaseUpgrade[] = [
  { key: 'pop', name: '인구', icon: '🍖', effect: (lv) => `최대 인구 ${FOOD_BASE + popBonus(lv)}` },
  { key: 'energy', name: '소환', icon: '⚡', effect: (lv) => `에너지 초당 ${energyRate(lv)} · 최대 ${energyMax(lv)}` },
];
