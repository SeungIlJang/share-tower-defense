import { describe, expect, it } from 'vitest';
import enemiesData from '../src/data/enemies.json';
import { DAILY_RULES, dailyBonus, dailyRule, dailyStage, dailyStageId, dailyUnits } from '../src/systems/daily';
import { isBoss } from '../src/systems/bosses';
import { STAGES } from '../src/systems/worlds';

describe('📅 오늘의 도전', () => {
  it('규칙은 날짜로 돌아감(7일 주기)', () => {
    expect(dailyRule(0).key).toBe(DAILY_RULES[0].key);
    expect(dailyRule(7).key).toBe(DAILY_RULES[0].key);
    expect(new Set([0, 1, 2, 3, 4, 5, 6].map((d) => dailyRule(d).key)).size).toBe(7);
  });

  it('관문 — 깬 곳 근처, 최소 3', () => {
    expect(dailyStageId(0, 3)).toBe(3);
    expect(dailyStageId(2, 50)).toBe(48);
  });

  it('규칙 적용 관문의 적은 모두 실제 있는 적', () => {
    const E = enemiesData as Record<string, unknown>;
    for (const r of DAILY_RULES)
      for (const id of [3, 25, 77]) {
        const s = dailyStage(STAGES[id - 1], r);
        for (const w of s.waves) for (const e of w.enemies) expect(E[e.type], `${r.key} ${id} ${e.type}`).toBeDefined();
      }
  });

  it('두 배 전쟁 · 보스 러시 · 하늘의 습격', () => {
    const base = STAGES[24];
    const n = (s: typeof base): number => s.waves.reduce((a, w) => a + w.enemies.filter((e) => !isBoss(e.type)).reduce((b, e) => b + e.count, 0), 0);
    expect(n(dailyStage(base, DAILY_RULES.find((r) => r.key === 'double')!))).toBeGreaterThan(n(base) * 1.8);
    const rush = dailyStage(base, DAILY_RULES.find((r) => r.key === 'bossRush')!);
    expect(rush.waves.every((w) => w.enemies.some((e) => isBoss(e.type)))).toBe(true);
    const sky = dailyStage(base, DAILY_RULES.find((r) => r.key === 'sky')!);
    expect(sky.waves.flatMap((w) => w.enemies).filter((e) => !isBoss(e.type)).every((e) => ['bat', 'vampire_bat', 'ghost', 'wisp', 'banshee', 'baby_dragon'].includes(e.type))).toBe(true);
  });

  it('출전 유닛 제한(하나도 없으면 전부)', () => {
    const r = DAILY_RULES.find((x) => x.key === 'ranged')!;
    expect(dailyUnits(r, ['soldier', 'archer'])).toEqual(['archer']);
    expect(dailyUnits(r, ['soldier'])).toEqual(['soldier']);
    expect(dailyBonus(10)).toBe(500);
  });
});
