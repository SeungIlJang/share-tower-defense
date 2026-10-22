import { describe, expect, it } from 'vitest';
import enemiesData from '../src/data/enemies.json';
import { MAX_STAGE, STAGES, WORLDS, bossOf, enemyMultFor, worldOf } from '../src/systems/worlds';

describe('🗺️ 관문 100개 · 월드 10개', () => {
  it('관문 1~100, 번호 순서대로', () => {
    expect(MAX_STAGE).toBe(100);
    expect(STAGES).toHaveLength(100);
    STAGES.forEach((s, i) => expect(s.id).toBe(i + 1));
  });

  it('월드 · 배율', () => {
    expect([1, 10, 11, 20, 21, 100].map(worldOf)).toEqual([1, 1, 2, 2, 3, 10]);
    expect(WORLDS).toHaveLength(10);
    expect(enemyMultFor(21)).toBeCloseTo(2.52);
    expect(enemyMultFor(100)).toBeCloseTo(12);
    expect(STAGES[99].enemyMult).toBeGreaterThan(STAGES[20].enemyMult!);
  });

  it('생성된 관문의 적은 모두 실제 있는 적', () => {
    const E = enemiesData as Record<string, unknown>;
    for (const s of STAGES) for (const w of s.waves) for (const e of w.enemies) expect(E[e.type], `${s.id} ${e.type}`).toBeDefined();
  });

  it('보스 표시', () => {
    expect(bossOf(30)).toBe('dragon');
    expect(bossOf(45)).toBe('ogre');
    expect(bossOf(47)).toBeNull();
  });
});
