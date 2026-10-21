import { describe, expect, it } from 'vitest';
import enemiesData from '../src/data/enemies.json';
import spriteManifest from '../public/sprites/manifest.json';
import type { EnemyStats } from '../src/types';
import { enemyLevel, hexColor, pickVariant, variantTable } from '../src/systems/enemyVariants';

const E = enemiesData as Record<string, EnemyStats>;
const M = spriteManifest as unknown as Record<string, unknown>;

describe('👾 적 변종', () => {
  it('적 31종 · 데이터가 서로 맞음', () => {
    expect(Object.keys(E).length).toBeGreaterThanOrEqual(31);
    for (const [k, e] of Object.entries(E)) {
      if (e.variantOf) expect(E[e.variantOf], `${k}.variantOf`).toBeDefined();
      if (e.summon) expect(E[e.summon], `${k}.summon`).toBeDefined();
      if (e.split) expect(E[e.split], `${k}.split`).toBeDefined();
      expect(M[e.look ?? k], `${k} 그림`).toBeDefined(); // 빌려 쓸 그림(또는 전용 그림)이 있어야 함
      if (e.ability) expect(['explode', 'heal', 'rage', 'summon', 'split', 'lifesteal']).toContain(e.ability);
    }
  });

  it('관문이 낮으면 변종이 안 나옴', () => {
    const t = variantTable(E);
    expect(pickVariant('goblin', 1, t, () => 0)).toBe('goblin'); // 고블린 궁수는 2관문부터
    expect(pickVariant('goblin', 2, t, () => 0)).toBe('goblin_archer');
    expect(pickVariant('goblin', 20, t, () => 0.99)).toBe('goblin'); // 확률에 안 걸리면 원래 적
  });

  it('여러 변종 중 처음 걸린 것', () => {
    const t = variantTable(E);
    const seq = [0.9, 0.0]; // 첫째 실패, 둘째 성공
    let i = 0;
    expect(pickVariant('goblin', 10, t, () => seq[i++] ?? 1)).toBe(t.goblin[1].key);
  });

  it('무한 모드 단계 · 색', () => {
    expect(enemyLevel(true, 0, 5)).toBe(6);
    expect(enemyLevel(true, 0, 99)).toBe(20);
    expect(enemyLevel(false, 7, 0)).toBe(7);
    expect(hexColor('#ffa04a')).toBe(0xffa04a);
    expect(hexColor(undefined)).toBeNull();
  });
});
