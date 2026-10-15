import { describe, it, expect } from 'vitest';
import { xpToNext, hasteMult, mimicMult, magicMult, supplyBonus, anyUpgradable, SKILLS, rollChoices, awakened, SKILL_BY_KEY, critChance } from '../src/systems/skills';

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
    expect(supplyBonus(4)).toBe(20);
    expect(supplyBonus(10)).toBe(50); // 상한 없음
  });

  it('배수는 하한 유지', () => {
    expect(hasteMult(100)).toBe(0.4);
    expect(magicMult(100)).toBe(0.5);
  });

  it('보급은 상한 없이 계속 선택 가능', () => {
    expect(anyUpgradable({ haste: 3, mimic: 9, magic: 5, supply: 999 })).toBe(true);
  });

  it('anyUpgradable — 전부 맥스면 false', () => {
    expect(anyUpgradable({})).toBe(true);
    const maxed: Record<string, number> = {};
    for (const s of SKILLS) maxed[s.key] = s.max;
    expect(anyUpgradable(maxed)).toBe(false);
  });
});

describe('레벨업 개편 — 무작위 3장 · 등급 · 각성', () => {
  it('겹치지 않게 3장, MAX 찍은 스킬은 안 나옴', () => {
    let seed = 1;
    const rng = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 50; i++) {
      const c = rollChoices({ haste: 3 }, rng);
      expect(c).toHaveLength(3);
      expect(new Set(c.map((s) => s.key)).size).toBe(3);
      expect(c.some((s) => s.key === 'haste')).toBe(false);
    }
  });

  it('고를 게 2개뿐이면 2장', () => {
    const lv: Record<string, number> = {};
    for (const s of SKILLS) if (Number.isFinite(s.max)) lv[s.key] = s.max;
    const left = SKILLS.filter((s) => !Number.isFinite(s.max)).length;
    expect(rollChoices(lv, Math.random, 99)).toHaveLength(left);
  });

  it('등급 가중치 — 일반이 전설보다 훨씬 자주', () => {
    const count = { common: 0, rare: 0, legend: 0 };
    for (let i = 0; i < 3000; i++) count[rollChoices({}, Math.random, 1)[0].grade]++;
    expect(count.common).toBeGreaterThan(count.legend * 3);
  });

  it('MAX에서 각성', () => {
    expect(awakened({ haste: 2 }, 'haste')).toBe(false);
    expect(awakened({ haste: 3 }, 'haste')).toBe(true);
    expect(awakened({ supply: 99 }, 'supply')).toBe(false); // 각성 없는 스킬
  });

  it('수치 표시', () => {
    expect(SKILL_BY_KEY.power.value!(2)).toBe('공격력 +20%');
    expect(SKILL_BY_KEY.crit.value!(0)).toBe('치명타 확률 10%');
    expect(critChance(4)).toBeCloseTo(0.3);
  });
});
