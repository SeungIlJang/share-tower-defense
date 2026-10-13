import { describe, it, expect } from 'vitest';
import { xpToNext, hasteMult, mimicMult, magicMult, supplyBonus, anyUpgradable, SKILLS } from '../src/systems/skills';

describe('skills', () => {
  it('필요 경험치는 레벨마다 증가', () => {
    expect(xpToNext(1)).toBe(25);
    expect(xpToNext(2)).toBe(34);
    expect(xpToNext(1)).toBeLessThan(xpToNext(5));
  });

  it('스킬 배수', () => {
    expect(hasteMult(0)).toBe(1);
    expect(hasteMult(3)).toBeCloseTo(0.76);
    expect(mimicMult(2)).toBeCloseTo(1.3);
    expect(magicMult(5)).toBeCloseTo(0.7);
    expect(supplyBonus(0)).toBe(0);
    expect(supplyBonus(4)).toBe(20); // 최대 레벨 → 인구 40 → 60
  });

  it('배수는 하한 유지', () => {
    expect(hasteMult(100)).toBe(0.4);
    expect(magicMult(100)).toBe(0.5);
  });

  it('anyUpgradable — 전부 맥스면 false', () => {
    expect(anyUpgradable({})).toBe(true);
    const maxed: Record<string, number> = {};
    for (const s of SKILLS) maxed[s.key] = s.max;
    expect(anyUpgradable(maxed)).toBe(false);
  });
});
