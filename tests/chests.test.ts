import { describe, expect, it } from 'vitest';
import { CHESTS, chestForEndless, chestForStage, rankMult, rankUpCost, rollChest } from '../src/systems/chests';

const seq = (vals: number[]): (() => number) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

describe('🎁 보물 상자', () => {
  it('등급 — 별 · 보스 · 첫 클리어', () => {
    expect(chestForStage(1, true, null)).toBe(0);
    expect(chestForStage(3, true, null)).toBe(2);
    expect(chestForStage(2, true, 'mid')).toBe(2);
    expect(chestForStage(3, true, 'mid')).toBe(3);
    expect(chestForStage(1, true, 'world')).toBe(3);
    expect(chestForStage(3, false, 'world')).toBe(0); // 다시 하기 = 나무
  });

  it('무한 모드', () => {
    expect(chestForEndless(4)).toBeNull();
    expect([5, 15, 30, 50].map(chestForEndless)).toEqual([0, 1, 2, 3]);
  });

  it('조각 총량은 상자 등급대로, 많이 쓴 유닛이 잘 뽑힘', () => {
    for (let t = 0; t < 4; t++) {
      const loot = rollChest(t as 0, ['soldier', 'archer', 'mage', 'knight'], {}, 1, Math.random);
      expect(Object.values(loot.shards).reduce((a, b) => a + b, 0)).toBe(CHESTS[t].shards);
      expect(Object.keys(loot.shards)).toHaveLength(CHESTS[t].stacks);
    }
    // archer를 99번 소환 → 첫 뽑기(rng 0.5)는 archer
    const loot = rollChest(0, ['soldier', 'archer', 'mage'], { archer: 99 }, 1, seq([0.5]));
    expect(Object.keys(loot.shards)).toEqual(['archer']);
  });

  it('유닛이 하나뿐이어도 조각을 다 받음 · 골드는 월드 배율', () => {
    const loot = rollChest(3, ['soldier'], {}, 2, seq([0.5]));
    expect(loot.shards).toEqual({ soldier: 24 });
    expect(loot.gold).toBe(1000);
  });

  it('🃏 랭크 비용 · 배수', () => {
    expect([0, 1, 2, 3, 4, 5].map(rankUpCost)).toEqual([10, 20, 40, 80, 160, null]);
    expect(rankMult(5)).toBeCloseTo(1.3);
  });
});
