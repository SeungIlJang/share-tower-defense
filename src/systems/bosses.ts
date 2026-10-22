/**
 * 👑 보스 — 골렘 두목·레드 드래곤 + 월드 보스 8종. 순수 데이터·계산(Vitest 검증). 그림: docs/world-boss-prompts.md
 * 월드 3~10: 10번째 관문 = 그 월드 보스, 5번째 관문 = 앞 월드 보스(중간 보스). 월드 1·2 = 골렘(5)·드래곤(10).
 */

export type BossSkill = 'slam' | 'breath' | 'frost' | 'poison' | 'eruption' | 'raise' | 'shards' | 'charge' | 'shadow' | 'hellfire';

export interface BossDef {
  key: string;
  name: string;
  world: number; // 이 보스가 '주인'인 월드(0 = 공용)
  skill: BossSkill;
  every: number; // 스킬 간격(초)
  icon: string; // 경고 구역 아이콘
  color: number; // 경고 구역 색
  reach: [number, number]; // 경고 구역 [보스 기준 왼쪽, 오른쪽] 범위(px)
  summon?: { type: string; n: number; every: number };
}

export const BOSSES: Record<string, BossDef> = {
  ogre: { key: 'ogre', name: '골렘 두목', world: 1, skill: 'slam', every: 6, icon: '💥', color: 0xff8a3a, reach: [120, 120] },
  dragon: { key: 'dragon', name: '레드 드래곤', world: 2, skill: 'breath', every: 7, icon: '🔥', color: 0xff3b3b, reach: [260, 0], summon: { type: 'bat', n: 2, every: 14 } },
  frost_giant: { key: 'frost_giant', name: '서리 거인', world: 3, skill: 'frost', every: 7, icon: '❄️', color: 0x7ad8ff, reach: [150, 120] },
  swamp_hydra: { key: 'swamp_hydra', name: '늪 히드라', world: 4, skill: 'poison', every: 7, icon: '🧪', color: 0x8aff5a, reach: [300, 0] },
  magma_titan: { key: 'magma_titan', name: '용암 거인', world: 5, skill: 'eruption', every: 7, icon: '🌋', color: 0xff6a2a, reach: [330, 0] },
  lich_king: { key: 'lich_king', name: '리치 왕', world: 6, skill: 'raise', every: 9, icon: '💀', color: 0x5aff9a, reach: [200, 0], summon: { type: 'skeleton', n: 4, every: 0 } },
  crystal_golem: { key: 'crystal_golem', name: '수정 골렘', world: 7, skill: 'shards', every: 7, icon: '💎', color: 0xc08aff, reach: [420, 0] },
  storm_griffin: { key: 'storm_griffin', name: '폭풍 그리폰', world: 8, skill: 'charge', every: 8, icon: '⚡', color: 0xffe14d, reach: [280, 0] },
  shadow_lord: { key: 'shadow_lord', name: '그림자 군주', world: 9, skill: 'shadow', every: 8, icon: '🌑', color: 0x9a5aff, reach: [320, 40] },
  demon_king: { key: 'demon_king', name: '마왕', world: 10, skill: 'hellfire', every: 7, icon: '🔥', color: 0xff2a2a, reach: [560, 0], summon: { type: 'orc_warchief', n: 1, every: 18 } },
};

export const BOSS_KEYS = new Set(Object.keys(BOSSES));

export function isBoss(type: string): boolean {
  return BOSS_KEYS.has(type);
}

/** 그 월드의 주인 보스 키 */
export function worldBoss(world: number): string {
  return Object.values(BOSSES).find((b) => b.world === world)?.key ?? (world % 2 ? 'ogre' : 'dragon');
}

/** 관문에 나올 보스 — 10번째 = 그 월드 보스, 5번째 = 앞 월드 보스(월드 1은 골렘), 나머지 null */
export function bossForStage(id: number): string | null {
  const w = Math.ceil(id / 10);
  const slot = ((id - 1) % 10) + 1;
  if (slot === 10) return w <= 2 ? 'dragon' : worldBoss(w);
  if (slot === 5) return w <= 3 ? 'ogre' : worldBoss(w - 1); // 월드 3 중간 보스 = 골렘(월드 2 '주인'은 드래곤이라 반복 방지)
  return null;
}
