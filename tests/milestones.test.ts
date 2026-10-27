import { describe, expect, it } from 'vitest';
import { milestoneBonus, milestoneCost, milestoneKind, milestoneLevel, milestonesAt, nextMilestone } from '../src/systems/milestones';

describe('🎁 진화 사이 작은 보상', () => {
  it('보상 레벨 15·25·…·95, 그 뒤 5레벨마다', () => {
    expect([0, 1, 8, 9, 10].map(milestoneLevel)).toEqual([15, 25, 95, 105, 110]);
    expect(milestonesAt(14)).toBe(0);
    expect(milestonesAt(15)).toBe(1);
    expect(milestonesAt(100)).toBe(9);
    expect(milestoneKind(0)).toBe('cost');
    expect(milestoneKind(3)).toBe('stats');
    expect(milestoneKind(12)).toBe('stats');
  });
  it('보상 합계', () => {
    expect(milestoneBonus(10)).toEqual({ costDown: 0, cooldown: 1, skill: 1, stats: 1 });
    const b = milestoneBonus(45); // 15 비용 · 25 대기 · 35 스킬 · 45 체공
    expect(b.costDown).toBe(3);
    expect(b.cooldown).toBeCloseTo(0.95);
    expect(b.skill).toBeCloseTo(1.05);
    expect(b.stats).toBeCloseTo(1.03);
    expect(milestoneBonus(95).costDown).toBe(9);
  });
  it('소환 비용은 5 아래로 안 내려감', () => {
    expect(milestoneCost(20, 95)).toBe(11);
    expect(milestoneCost(8, 95)).toBe(5);
  });
  it('다음 보상 진행 막대(진화 레벨부터)', () => {
    const n = nextMilestone(12, 10);
    expect(n.lv).toBe(15);
    expect(n.left).toBe(3);
    expect(n.ratio).toBeCloseTo(0.4);
    expect(nextMilestone(15, 10).lv).toBe(25);
  });
});
