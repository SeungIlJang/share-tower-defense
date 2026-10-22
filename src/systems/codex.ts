/**
 * 📖 몬스터 도감 — 처치한 적이 도감에 등록(발견), 발견 보상 + 수집 단계 보상. 순수 로직(Vitest 검증). 계획: docs/hit-plan.md D
 */
import { isBoss } from './bosses';

/** 발견 보상(한 마리당 1번) — 보스는 크게 */
export function discoverReward(type: string): number {
  return isBoss(type) ? 150 : 30;
}

/** 수집 단계 보상 — n마리 발견하면 골드 + 모든 보유 유닛 조각 */
export const CODEX_MILESTONES: { need: number; gold: number; shards: number }[] = [
  { need: 10, gold: 500, shards: 5 },
  { need: 20, gold: 1200, shards: 10 },
  { need: 30, gold: 2500, shards: 20 },
  { need: 40, gold: 5000, shards: 40 },
];

/** 처치 수 → 도감 별(0~3): 1 / 50 / 300 */
export function codexStars(kills: number): number {
  return kills >= 300 ? 3 : kills >= 50 ? 2 : kills >= 1 ? 1 : 0;
}

/** 지금 받을 수 있는 수집 단계(없으면 -1) */
export function claimableMilestone(found: number, claimed: number[]): number {
  return CODEX_MILESTONES.findIndex((m, i) => found >= m.need && !claimed.includes(i));
}

/** 처치 기록 합치기 */
export function mergeKills(into: Record<string, number>, add: Record<string, number>): Record<string, number> {
  const out = { ...into };
  for (const [k, n] of Object.entries(add)) out[k] = (out[k] ?? 0) + n;
  return out;
}
