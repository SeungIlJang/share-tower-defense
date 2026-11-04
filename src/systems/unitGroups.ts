/**
 * 🛡️ 유닛 분류 — 근접 · 원거리 · 마법 · 설치물. 순수 로직(Vitest 검증).
 * 강화 화면 묶음 탭, 전투 카드 이름표 색·아이콘, 진화 사이 보상 종류에 씀.
 */
export type UnitGroup = 'melee' | 'ranged' | 'magic' | 'totem';

export const UNIT_GROUPS: { key: UnitGroup; label: string; color: number }[] = [
  { key: 'melee', label: '⚔️ 근접', color: 0xc0453a },
  { key: 'ranged', label: '🏹 원거리', color: 0x2f8a4d },
  { key: 'magic', label: '🔮 마법', color: 0x7a4ab8 },
  { key: 'totem', label: '🗿 설치물', color: 0x8a6a3a },
];

export const RANGED_MIN = 100; // 사거리 이 이상 = 원거리

/** 유닛 → 분류(움직이지 않으면 설치물 · 마법 계열이면 마법 · 사거리로 근접/원거리) */
export function unitGroup(u: { range: number; speed: number; role?: string }): UnitGroup {
  if (u.speed <= 0) return 'totem';
  if (u.role === 'magic') return 'magic';
  return u.range >= RANGED_MIN ? 'ranged' : 'melee';
}

/** 분류 정보(아이콘·색) */
export function groupInfo(g: UnitGroup): { key: UnitGroup; label: string; color: number; icon: string } {
  const info = UNIT_GROUPS.find((x) => x.key === g)!;
  return { ...info, icon: info.label.split(' ')[0] };
}
