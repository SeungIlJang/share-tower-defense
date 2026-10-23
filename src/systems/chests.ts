/**
 * 🎁 보물 상자 + 🃏 유닛 카드 조각 — 순수 로직(Vitest 검증). 계획: docs/hit-plan.md C
 * 관문을 깨면 상자(별·보스·첫 클리어로 등급 결정). 열면 골드 + 이번 판에 많이 쓴 유닛의 카드 조각.
 * 조각을 모아 '카드 랭크'를 올리면 그 유닛의 체력·공격력이 영구로 오름(골드 강화와 별개로 곱해짐).
 */

export type ChestTier = 0 | 1 | 2 | 3; // 나무 · 은 · 금 · 전설

export interface ChestDef {
  name: string;
  icon: string;
  color: number; // 상자 몸통
  band: number; // 띠·자물쇠
  gold: number; // 기본 골드(월드 배율 곱함)
  shards: number; // 조각 총량
  stacks: number; // 몇 유닛에 나눠 주나(최대)
}

export const CHESTS: ChestDef[] = [
  { name: '나무 상자', icon: '🪵', color: 0x9a6a3a, band: 0x5a3a1a, gold: 40, shards: 4, stacks: 1 },
  { name: '은 상자', icon: '🥈', color: 0xb8c4d8, band: 0x6a7a98, gold: 100, shards: 8, stacks: 2 },
  { name: '금 상자', icon: '🥇', color: 0xffc93a, band: 0xc07a00, gold: 220, shards: 14, stacks: 2 },
  { name: '전설 상자', icon: '💜', color: 0xb07aff, band: 0x5a2ad8, gold: 500, shards: 24, stacks: 3 },
];

/** 관문 클리어 상자 등급 — 별 수(1~3 → 나무·은·금), 처음 깬 보스 관문 +1(월드 보스 = 전설), 다시 하기 = 나무 */
export function chestForStage(stars: number, firstClear: boolean, bossStage: 'mid' | 'world' | null): ChestTier {
  if (!firstClear) return 0;
  if (bossStage === 'world') return 3;
  const t = Math.max(0, Math.min(2, stars - 1)) + (bossStage === 'mid' ? 1 : 0);
  return Math.min(3, t) as ChestTier;
}

/** ♾️ 무한 모드 상자 — 웨이브 5 나무 · 15 은 · 30 금 · 50 전설(5 미만은 없음) */
export function chestForEndless(wave: number): ChestTier | null {
  if (wave >= 50) return 3;
  if (wave >= 30) return 2;
  if (wave >= 15) return 1;
  if (wave >= 5) return 0;
  return null;
}

export interface ChestLoot {
  tier: ChestTier;
  gold: number;
  shards: Record<string, number>;
  equip?: string | null; // 🛡️ 영웅 장비(없으면 null) — 이미 있으면 등급 +1
  equipGold?: number; // 이미 최고 등급이라 골드로 바뀐 몫
}

/**
 * 상자 열기 — 조각은 '이번 판에 소환한 횟수 + 1' 비율로 뽑은 유닛에 나눠 줌(쓰는 유닛이 강해지는 애착).
 * owned: 보유 유닛, used: 이번 판 유닛별 소환 수
 */
export function rollChest(tier: ChestTier, owned: string[], used: Record<string, number>, goldMult: number, rng: () => number): ChestLoot {
  const def = CHESTS[tier];
  const gold = Math.round(def.gold * goldMult * (0.9 + 0.2 * rng()));
  const shards: Record<string, number> = {};
  const pool = owned.map((k) => ({ k, w: (used[k] ?? 0) + 1 }));
  const n = Math.min(def.stacks, pool.length);
  const picked: string[] = [];
  for (let i = 0; i < n; i++) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = rng() * total;
    const idx = pool.findIndex((p) => (r -= p.w) < 0);
    const [p] = pool.splice(idx < 0 ? pool.length - 1 : idx, 1);
    picked.push(p.k);
  }
  // 첫 번째로 뽑힌 유닛이 가장 많이(절반), 나머지는 고르게
  let left = def.shards;
  picked.forEach((k, i) => {
    const amt = i === picked.length - 1 ? left : i === 0 ? Math.ceil(def.shards / 2) : Math.floor(left / (picked.length - i));
    shards[k] = amt;
    left -= amt;
  });
  return { tier, gold, shards };
}

// 🃏 카드 랭크 — 조각으로 올림(최대 5), 랭크당 체력·공격 +6%
export const RANK_MAX = 5;

/** 랭크 r → r+1에 필요한 조각 (10 · 20 · 40 · 80 · 160) */
export function rankUpCost(rank: number): number | null {
  return rank >= RANK_MAX ? null : 10 * 2 ** rank;
}

/** 랭크 → 능력치 배수 */
export function rankMult(rank: number): number {
  return 1 + 0.06 * rank;
}
