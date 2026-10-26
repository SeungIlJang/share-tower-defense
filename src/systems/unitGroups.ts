/**
 * 🛡️ 강화 화면 유닛 분류 — 근접 · 원거리 · 설치물. 순수 로직(Vitest 검증).
 * 한 화면에 15종이 몰려 작게 보이던 것을 3묶음으로 나눠 카드·그림을 크게 보여 줌.
 */
export type UnitGroup = 'melee' | 'ranged' | 'totem';

export const UNIT_GROUPS: { key: UnitGroup; label: string }[] = [
  { key: 'melee', label: '⚔️ 근접' },
  { key: 'ranged', label: '🏹 원거리' },
  { key: 'totem', label: '🗿 설치물' },
];

export const RANGED_MIN = 100; // 사거리 이 이상 = 원거리

/** 유닛 → 분류(움직이지 않으면 설치물) */
export function unitGroup(u: { range: number; speed: number }): UnitGroup {
  if (u.speed <= 0) return 'totem';
  return u.range >= RANGED_MIN ? 'ranged' : 'melee';
}
