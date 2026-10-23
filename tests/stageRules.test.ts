import { describe, expect, it } from 'vitest';
import { breachGoal, holdProdMult, holdSeconds, stageRule, targetBonus, targetTime, wagonHp } from '../src/systems/stageRules';
import { bossForStage } from '../src/systems/bosses';
import { STAGES } from '../src/systems/worlds';

describe('🎯 특수 관문', () => {
  it('월드마다 3 호위 · 7 수성 · 8 돌파(1월드 3관문은 일반)', () => {
    expect(stageRule(3)).toBe('normal');
    expect(stageRule(13)).toBe('escort');
    expect(stageRule(7)).toBe('hold');
    expect(stageRule(18)).toBe('breach');
    expect(stageRule(1)).toBe('normal');
  });

  it('보스 관문과 겹치지 않음', () => {
    for (let id = 1; id <= 100; id++) if (bossForStage(id)) expect(stageRule(id), String(id)).toBe('normal');
  });

  it('수치', () => {
    expect(holdSeconds(7)).toBe(75);
    expect(holdSeconds(97)).toBe(120);
    expect(holdProdMult(0, 75)).toBe(1);
    expect(holdProdMult(75, 75)).toBeCloseTo(0.4);
    expect(breachGoal(8)).toBe(6);
    expect(breachGoal(98)).toBe(15);
    expect(wagonHp(100, 1)).toBe(400);
  });

  it('⏱️ 목표 시간 — 10초 단위, 수성은 없음, 특수 관문은 여유 +30초', () => {
    const t1 = targetTime(STAGES[0])!;
    expect(t1 % 10).toBe(0);
    expect(t1).toBeGreaterThan(Math.max(...STAGES[0].waves.map((w) => w.at)));
    expect(targetTime(STAGES[6])).toBeNull();
    expect(targetTime(STAGES[7], 'breach')! - targetTime(STAGES[7], 'normal')!).toBeGreaterThanOrEqual(20);
    expect(targetBonus(10)).toBe(80);
  });
});
