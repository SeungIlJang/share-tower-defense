import { describe, it, expect } from 'vitest';
import { DENSE_MULT, ENEMY_DENSITY, enemyPower, thinCount, thinStage } from '../src/systems/density';
import { STAGES } from '../src/systems/worlds';
import { isBoss } from '../src/systems/bosses';

const total = (s: typeof STAGES[number], boss = false): number =>
  s.waves.reduce((a, w) => a + w.enemies.filter((g) => isBoss(g.type) === boss).reduce((b, g) => b + g.count, 0), 0);
const lastSpawn = (s: typeof STAGES[number]): number => Math.max(...s.waves.flatMap((w) => w.enemies.map((g) => w.at + (g.count - 1) * g.interval)));

describe('👥 적 밀도', () => {
  it('마릿수는 줄고 최소 1, 한 마리는 그만큼 셈', () => {
    expect(thinCount(10)).toBe(5);
    expect(thinCount(1)).toBe(1);
    expect(thinCount(2)).toBe(1);
    expect(DENSE_MULT * ENEMY_DENSITY).toBeCloseTo(1);
  });
  it('💪 난이도 — 1~3관문은 그대로, 4관문부터 세짐(보스는 덜)', () => {
    expect(enemyPower(1, false)).toBe(1);
    expect(enemyPower(3, false)).toBe(1);
    expect(enemyPower(4, false)).toBeGreaterThan(1);
    expect(enemyPower(1, true)).toBeGreaterThan(1);
    expect(enemyPower(10, false, true)).toBeLessThan(enemyPower(10, false));
  });
  it('관문마다 일반 적 약 60% · 보스 수는 그대로 · 마지막 적이 나오는 시각은 거의 그대로', () => {
    for (const s of STAGES) {
      const t = thinStage(s);
      expect(total(t)).toBeLessThanOrEqual(Math.ceil(total(s) * 0.75));
      expect(total(t, true)).toBe(total(s, true));
      expect(lastSpawn(t)).toBeLessThanOrEqual(lastSpawn(s) + 1e-6); // 2마리 → 1마리 묶음은 두 번째 시각이 없어짐
      expect(lastSpawn(t)).toBeGreaterThan(lastSpawn(s) - 6);
    }
  });
});
