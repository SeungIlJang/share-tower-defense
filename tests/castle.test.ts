import { describe, expect, it } from 'vitest';
import { castleArchers, allyCastleGun, allyCastleTier, castleHpMult, castleLook, castleTarget, castleUpCost, enemyCastleGun, enemyCastleTier } from '../src/systems/castle';

describe('🏰 성', () => {
  it('우리 성 단계(레벨 0·5·10·15·20)', () => {
    expect([0, 4, 5, 10, 14, 15, 20].map(allyCastleTier)).toEqual([0, 0, 1, 2, 2, 3, 4]);
  });

  it('적 성 단계 — 관문 / 무한 웨이브', () => {
    expect([1, 4, 5, 9, 13, 17, 20].map((s) => enemyCastleTier(false, s, 0))).toEqual([0, 0, 1, 2, 3, 4, 4]);
    expect([1, 3, 4, 8, 16, 40].map((w) => enemyCastleTier(true, 0, w))).toEqual([0, 0, 1, 2, 4, 4]);
  });

  it('그림 키', () => {
    expect(castleLook('ally', 0)).toBe('base_ally');
    expect(castleLook('enemy', 3)).toBe('base_enemy_t4');
  });

  it('강화 효과 · 비용', () => {
    expect(castleHpMult(20)).toBeCloseTo(3);
    expect(allyCastleGun(0, 0)).toEqual({ dmg: 30, range: 460, interval: 1.2 });
    expect(allyCastleGun(20, 0).range).toBe(660);
    expect(castleArchers(0)).toBe(1);
    expect(castleArchers(4)).toBe(4);
    expect(allyCastleGun(10, 10).dmg).toBeGreaterThan(allyCastleGun(0, 0).dmg);
    expect(allyCastleGun(0, 10).interval).toBeCloseTo(0.48);
    expect(castleUpCost('castle', 0)).toBe(200);
    expect(castleUpCost('castleRate', 1)).toBe(430);
  });

  it('적 성은 우리 성보다 약함', () => {
    expect(enemyCastleGun(0, 1).dmg).toBeLessThan(allyCastleGun(0, 0).dmg);
  });

  it('사거리 안 가장 가까운 앞쪽 대상', () => {
    const list = [
      { x: 500, active: true },
      { x: 300, active: true },
      { x: 50, active: true }, // 뒤
      { x: 250, active: false },
    ];
    expect(castleTarget(100, 1, 300, list)?.x).toBe(300);
    expect(castleTarget(100, 1, 100, list)).toBeNull();
    expect(castleTarget(100, 1, 460, list)?.x).toBe(300);
    expect(castleTarget(600, -1, 200, list)?.x).toBe(500);
  });
});
