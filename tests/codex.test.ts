import { describe, expect, it } from 'vitest';
import { CODEX_MILESTONES, claimableMilestone, codexStars, discoverReward, mergeKills } from '../src/systems/codex';

describe('📖 몬스터 도감', () => {
  it('발견 보상 — 보스는 크게', () => {
    expect(discoverReward('goblin')).toBe(30);
    expect(discoverReward('demon_king')).toBe(150);
  });

  it('처치 수 → 별', () => {
    expect([0, 1, 49, 50, 300].map(codexStars)).toEqual([0, 1, 1, 2, 3]);
  });

  it('수집 단계 — 차례대로 한 번씩', () => {
    expect(claimableMilestone(9, [])).toBe(-1);
    expect(claimableMilestone(10, [])).toBe(0);
    expect(claimableMilestone(25, [0])).toBe(1);
    expect(claimableMilestone(25, [0, 1])).toBe(-1);
    expect(CODEX_MILESTONES.at(-1)!.need).toBeLessThanOrEqual(40);
  });

  it('처치 기록 합치기', () => {
    expect(mergeKills({ goblin: 2 }, { goblin: 3, orc: 1 })).toEqual({ goblin: 5, orc: 1 });
  });
});
