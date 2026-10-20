import { describe, expect, it } from 'vitest';
import { AURA_RADIUS, heroStats, inAura, maceTargets, stepToward } from '../src/systems/hero';

describe('👑 영웅', () => {
  it('스테이지·적 배율에 따라 강해짐', () => {
    expect(heroStats(1).hp).toBe(1100);
    expect(heroStats(11).hp).toBeGreaterThan(heroStats(1).hp);
    expect(heroStats(1, 2).atk).toBe(60);
  });

  it('오라 판정', () => {
    expect(inAura(100, 100)).toBe(true);
    expect(inAura(100 + AURA_RADIUS, 100)).toBe(true);
    expect(inAura(100 + AURA_RADIUS + 1, 100)).toBe(false);
    expect(inAura(0, 100, 50)).toBe(false);
  });

  it('목표로 한 걸음 — 넘어가지 않고 범위 안', () => {
    expect(stepToward(100, 200, 100, 0.5, 0, 1000)).toBe(150);
    expect(stepToward(190, 200, 100, 0.5, 0, 1000)).toBe(200);
    expect(stepToward(100, 0, 100, 0.5, 80, 1000)).toBe(80);
    expect(stepToward(900, 2000, 1000, 1, 0, 1000)).toBe(1000);
  });

  it('철퇴 — 앞쪽 사거리 안 가까운 2명', () => {
    const es = [
      { x: 500, active: true },
      { x: 150, active: true },
      { x: 300, active: true },
      { x: 50, active: true }, // 뒤쪽
      { x: 200, active: false },
    ];
    expect(maceTargets(100, es).map((e) => e.x)).toEqual([150, 300]);
    expect(maceTargets(100, es, 100)).toHaveLength(1);
  });
});
