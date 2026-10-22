import { describe, expect, it } from 'vitest';
import enemiesData from '../src/data/enemies.json';
import unitsData from '../src/data/units.json';
import { COUNTER_MULT, UNIT_COUNTER, counterMult, enemyKind, goodUnits, normalizeDeck, stageEnemies, stageKinds } from '../src/systems/counters';
import { STAGES } from '../src/systems/worlds';

describe('⚔️ 유닛 상성', () => {
  it('모든 적에게 종류가 있음(보스 = 거대)', () => {
    for (const k of Object.keys(enemiesData)) expect(enemyKind(k), k).not.toBeNull();
    expect(enemyKind('demon_king')).toBe('giant');
  });

  it('모든 유닛에 상성 정의 · 6종류 모두 누군가 담당', () => {
    for (const k of Object.keys(unitsData)) expect(k in UNIT_COUNTER, k).toBe(true);
    expect(new Set(Object.values(UNIT_COUNTER).filter(Boolean)).size).toBe(6);
  });

  it('피해 배수', () => {
    expect(counterMult('archer', 'bat')).toBe(COUNTER_MULT);
    expect(counterMult('archer', 'orc')).toBe(1);
    expect(counterMult('spear', 'dragon')).toBe(COUNTER_MULT);
    expect(counterMult('cleric', 'bat')).toBe(1);
  });

  it('관문 미리보기 — 보스 먼저, 종류별 합계', () => {
    const s = STAGES[9];
    expect(stageEnemies(s)[0].type).toBe('ancient_treant');
    const kinds = stageKinds(s);
    expect(kinds.reduce((n, k) => n + k.count, 0)).toBeGreaterThan(0);
    expect(goodUnits(s, ['spear', 'cleric'])).toEqual(['spear']);
  });

  it('출전 덱 — 보유만 · 최대 6 · 빈칸 채움', () => {
    const owned = ['soldier', 'archer', 'knight', 'spear', 'mage', 'rogue', 'cleric', 'cannon'];
    expect(normalizeDeck([], owned)).toEqual(owned.slice(0, 6));
    expect(normalizeDeck(['cannon', 'cleric', 'nope'], owned)).toEqual(['cannon', 'cleric', 'soldier', 'archer', 'knight', 'spear']);
    expect(normalizeDeck(['archer'], ['soldier', 'archer'])).toEqual(['archer', 'soldier']);
  });
});
