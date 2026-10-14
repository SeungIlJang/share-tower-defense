import { describe, it, expect } from 'vitest';
import { UNIT_SKILLS, skillEvery, skillMult, isSkillSwing } from '../src/systems/unitSkills';
import unitsData from '../src/data/units.json';

describe('유닛 스킬', () => {
  it('유닛 12종 모두 스킬 정의', () => {
    for (const k of Object.keys(unitsData)) expect(UNIT_SKILLS[k], k).toBeDefined();
  });
  it('Lv0은 스킬 없음', () => {
    expect(skillEvery(0)).toBe(Infinity);
    expect(skillMult(0)).toBe(0);
    expect(isSkillSwing(5, 0)).toBe(false);
  });
  it('발동 간격 Lv1 5번 → Lv2 4번 → Lv4 3번', () => {
    expect(skillEvery(1)).toBe(5);
    expect(skillEvery(3)).toBe(4);
    expect(skillEvery(4)).toBe(3);
    expect(skillEvery(9)).toBe(3);
  });
  it('위력 1.5 + 0.2×레벨', () => {
    expect(skillMult(1)).toBeCloseTo(1.7);
    expect(skillMult(5)).toBeCloseTo(2.5);
  });
  it('N번째 공격마다 발동', () => {
    expect([1, 2, 3, 4, 5, 10].map((s) => isSkillSwing(s, 1))).toEqual([false, false, false, false, true, true]);
  });
});
