import { describe, expect, it } from 'vitest';
import enemiesData from '../src/data/enemies.json';
import { MAX_STAGE, STAGES, WORLDS, bossOf, enemyMultFor, goldMultFor, recommendedLevel, worldOf } from '../src/systems/worlds';

describe('🗺️ 관문 100개 · 월드 10개', () => {
  it('관문 1~100, 번호 순서대로', () => {
    expect(MAX_STAGE).toBe(100);
    expect(STAGES).toHaveLength(100);
    STAGES.forEach((s, i) => expect(s.id).toBe(i + 1));
  });

  it('월드 · 배율', () => {
    expect([1, 10, 11, 20, 21, 100].map(worldOf)).toEqual([1, 1, 2, 2, 3, 10]);
    expect(WORLDS).toHaveLength(10);
    expect(enemyMultFor(21)).toBeCloseTo(2.49);
    expect(enemyMultFor(100)).toBeCloseTo(9.6);
    expect(goldMultFor(5)).toBe(1);
    expect(goldMultFor(100)).toBeCloseTo(2.35);
    expect(recommendedLevel(10, 1)).toBe(3);
    expect(recommendedLevel(100, 9.6)).toBeGreaterThanOrEqual(30);
    expect(STAGES[99].enemyMult).toBeGreaterThan(STAGES[20].enemyMult!);
  });

  it('생성된 관문의 적은 모두 실제 있는 적', () => {
    const E = enemiesData as Record<string, unknown>;
    for (const s of STAGES) for (const w of s.waves) for (const e of w.enemies) expect(E[e.type], `${s.id} ${e.type}`).toBeDefined();
  });

  it('보스 표시', () => {
    expect(bossOf(10)).toBe('ancient_treant'); // 5 = 골렘 두목, 10 = 고대 나무 거인, 20 = 레드 드래곤
    expect(STAGES[9].waves.some((w) => w.enemies.some((e) => e.type === 'ancient_treant'))).toBe(true);
    expect(STAGES[14].waves.some((w) => w.enemies.some((e) => e.type === 'ancient_treant'))).toBe(true);
    expect(bossOf(20)).toBe('dragon');
    expect(bossOf(5)).toBe('ogre');
    expect(STAGES[4].waves.some((w) => w.enemies.some((e) => e.type === 'ogre'))).toBe(true);
    expect(bossOf(15)).toBe('ancient_treant');
    expect(bossOf(25)).toBe('dragon');
    expect(STAGES[9].waves.some((w) => w.enemies.some((e) => e.type === 'dragon'))).toBe(false);
    expect(STAGES[19].waves.some((w) => w.enemies.some((e) => e.type === 'dragon'))).toBe(true);
    expect(bossOf(30)).toBe('frost_giant');
    expect(bossOf(45)).toBe('swamp_hydra'); // 5번째 = 앞 월드 보스
    expect(bossOf(100)).toBe('demon_king');
    expect(STAGES[99].waves.some((w) => w.enemies.some((e) => e.type === 'demon_king'))).toBe(true);
    expect(STAGES[29].waves.some((w) => w.enemies.some((e) => e.type === 'dragon'))).toBe(false);
    expect(bossOf(47)).toBeNull();
  });

  it('🐣 1~3관문은 쉽게(1관문 보스 없음 · 2관문 보스 1)', () => {
    const count = (id: number, boss: boolean): number =>
      STAGES[id - 1].waves.reduce((n, w) => n + w.enemies.filter((e) => (e.type === 'ogre') === boss).reduce((m, e) => m + e.count, 0), 0);
    expect(count(1, true)).toBe(0);
    expect(count(2, true)).toBe(1);
    expect(count(1, false)).toBeLessThan(count(4, false));
    // 21관문 이상은 원래 1관문 구성 그대로(골렘 포함)
    expect(STAGES[20].waves.some((w) => w.enemies.some((e) => e.type === 'ogre'))).toBe(true);
  });
});
