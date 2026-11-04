import { describe, it, expect } from 'vitest';
import { CHAIN_FREE_EVERY, CHAIN_VOLLEY_EVERY, chainRate, chainReward, chainScale, nextChain } from '../src/systems/perfectChain';
import { WaveSystem } from '../src/systems/waves';
import type { StageData } from '../src/types';

describe('🔥 PERFECT 체인', () => {
  it('PERFECT면 +1, 빗나가면 0', () => {
    expect(nextChain(0, true)).toBe(1);
    expect(nextChain(4, true)).toBe(5);
    expect(nextChain(4, false)).toBe(0);
  });
  it('3마다 무료 소환 · 5마다 발리 · 15는 둘 다', () => {
    expect(chainReward(0)).toEqual({ free: false, volley: false });
    expect(chainReward(CHAIN_FREE_EVERY)).toEqual({ free: true, volley: false });
    expect(chainReward(CHAIN_VOLLEY_EVERY)).toEqual({ free: false, volley: true });
    expect(chainReward(15)).toEqual({ free: true, volley: true });
    expect(chainReward(4).free || chainReward(4).volley).toBe(false);
  });
  it('음정은 올라가다 멈추고, 글씨는 커지다 멈춤', () => {
    expect(chainRate(1)).toBe(1);
    expect(chainRate(5)).toBeGreaterThan(chainRate(3));
    expect(chainRate(30)).toBe(chainRate(9));
    expect(chainScale(2)).toBe(1);
    expect(chainScale(50)).toBe(2.2);
  });
});

describe('📣 다음 무리 예고', () => {
  const stage = {
    id: 1,
    name: 't',
    baseHp: 100,
    startGold: 0,
    goldRate: 0,
    waves: [
      { at: 20, enemies: [{ type: 'orc', count: 2, interval: 1 }] },
      { at: 3, enemies: [{ type: 'goblin', count: 3, interval: 0.5 }, { type: 'wolf', count: 1, interval: 0 }] },
    ],
  } as StageData;
  it('lead초 안의 웨이브를 시각순으로 한 번만', () => {
    const w = new WaveSystem(stage);
    expect(w.nextWave(5)).toEqual({ at: 3, groups: [{ type: 'goblin', count: 3 }, { type: 'wolf', count: 1 }] });
    expect(w.nextWave(5)).toBeNull(); // 20초 웨이브는 아직 멀었음
    w.update(14);
    expect(w.nextWave(5)).toBeNull();
    w.update(1.5);
    expect(w.nextWave(5)?.at).toBe(20);
    expect(w.nextWave(5)).toBeNull();
    expect(w.now).toBeCloseTo(15.5);
  });
});
