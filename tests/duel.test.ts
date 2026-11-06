import { describe, it, expect } from 'vitest';
import { DUEL_FROM, duelFoeStats, duelPlanned, duelTime, pickChampion } from '../src/systems/duel';
import { stageRule } from '../src/systems/stageRules';
import { FEATURES } from '../src/systems/tutorial';
import { computeDamage } from '../src/systems/combat';
import { STAGES } from '../src/systems/worlds';

describe('⚔️ 일기토', () => {
  it('보스 관문은 꼭 · 일반 관문은 가끔 · 특수 관문·초반엔 없음', () => {
    expect(duelPlanned(10, 'normal', () => 0.99)).toBe(true);
    expect(duelPlanned(15, 'normal', () => 0.99)).toBe(true); // 중간 보스
    expect(duelPlanned(12, 'normal', () => 0.1)).toBe(true);
    expect(duelPlanned(12, 'normal', () => 0.5)).toBe(false);
    expect(duelPlanned(13, 'escort', () => 0)).toBe(false);
    expect(duelPlanned(4, 'normal', () => 0)).toBe(false);
    expect(FEATURES.find((f) => f.key === 'duel')?.stage).toBe(DUEL_FROM);
  });
  it('일기토 관문 = 2월드부터 6번째 관문(중간 보스 다음)', () => {
    expect(stageRule(6)).toBe('normal');
    expect([16, 26, 56, 96].map(stageRule)).toEqual(['duel', 'duel', 'duel', 'duel']);
    expect(stageRule(15)).toBe('normal');
  });
  it('적장 등장 시각은 중반(최소 15초)', () => {
    for (const s of STAGES.slice(0, 30)) {
      const last = Math.max(...s.waves.map((w) => w.at));
      const t = duelTime(s);
      expect(t).toBeGreaterThanOrEqual(15);
      expect(t).toBeLessThanOrEqual(Math.max(15, last));
    }
  });
  it('적장은 가장 센 일반 적(보스 제외)', () => {
    const stats = { goblin: { hp: 90, atk: 12 }, orc: { hp: 220, atk: 24 }, dragon_boss: { hp: 9999, atk: 99 } };
    expect(pickChampion(['goblin', 'orc', 'dragon_boss'], stats, (t) => t.endsWith('boss'))).toBe('orc');
    expect(pickChampion([], stats, () => false)).toBe('orc');
  });
  it('적장 능력치 — 계산상 18초 vs 12초(실전은 스킬·치명타로 아슬아슬), 관문은 더 셈', () => {
    const ally = { name: 'a', hp: 240, atk: 22, def: 12, atkSpeed: 0.8, range: 46, speed: 56 };
    const base = { name: 'o', hp: 220, atk: 24, def: 6, atkSpeed: 0.8, range: 40, speed: 40 };
    const f = duelFoeStats(ally, base);
    const killAlly = ally.hp / (computeDamage(f.atk, ally.def) * f.atkSpeed);
    const killFoe = f.hp / (computeDamage(ally.atk, f.def) * ally.atkSpeed);
    expect(killAlly).toBeLessThan(killFoe);
    expect(killFoe / killAlly).toBeLessThan(1.6); // 상성(×1.5)·필살이면 뒤집힘
    const hard = duelFoeStats(ally, base, true);
    expect(hard.hp).toBeGreaterThan(f.hp);
  });
});
