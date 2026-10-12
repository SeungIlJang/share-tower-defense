import { describe, it, expect } from 'vitest';
import {
  computeDamage,
  applyDamage,
  isDead,
  attackCooldown,
  inRange,
} from '../src/systems/combat';

describe('combat', () => {
  it('데미지 = 공격력 - 방어력/2, 최소 1', () => {
    expect(computeDamage(20, 6)).toBe(17);
    expect(computeDamage(10, 100)).toBe(1); // 하한
    expect(computeDamage(0, 0)).toBe(1);
  });

  it('피해 적용은 0 미만으로 안 내려감', () => {
    expect(applyDamage(100, 30)).toBe(70);
    expect(applyDamage(10, 999)).toBe(0);
  });

  it('사망 판정', () => {
    expect(isDead(0)).toBe(true);
    expect(isDead(1)).toBe(false);
  });

  it('공격 쿨다운 = 1 / 공속', () => {
    expect(attackCooldown(2)).toBe(0.5);
    expect(attackCooldown(0)).toBe(Infinity);
  });

  it('사거리 판정', () => {
    expect(inRange(100, 130, 40)).toBe(true);
    expect(inRange(100, 200, 40)).toBe(false);
  });
});
