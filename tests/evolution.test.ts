import { describe, expect, it } from 'vitest';
import { evolvedKey, nextUnitTier, starText, tierKey, unitOfKey, unitPreloadKeys, unitTier } from '../src/systems/evolution';

describe('⭐ 유닛 진화', () => {
  it('강화 레벨 → 단계', () => {
    expect(unitTier(0)).toBe(0);
    expect(unitTier(4)).toBe(0);
    expect(unitTier(5)).toBe(1);
    expect(unitTier(10)).toBe(2);
    expect(unitTier(30)).toBe(2);
    expect(nextUnitTier(3)?.min).toBe(5);
    expect(nextUnitTier(12)).toBeNull();
    expect(starText(6)).toBe('★★☆');
  });

  it('그림 키 이름', () => {
    expect(tierKey('mage', false, 0)).toBe('mage');
    expect(tierKey('mage', false, 2)).toBe('mage_t3');
    expect(tierKey('mage', true, 1)).toBe('mage@legend_t2');
    expect(unitOfKey('mage@legend_t3')).toBe('mage');
    expect(unitOfKey('mage_t2')).toBe('mage');
  });

  it('그림이 없으면 아래 단계로', () => {
    const has = (k: string): boolean => ['mage', 'mage_t2', 'mage@legend'].includes(k);
    expect(evolvedKey('mage', 12, false, has)).toBe('mage_t2'); // t3 없음 → t2
    expect(evolvedKey('mage', 6, false, has)).toBe('mage_t2');
    expect(evolvedKey('mage', 2, false, has)).toBe('mage');
    expect(evolvedKey('mage', 12, true, has)).toBe('mage@legend'); // 전설 t3·t2 없음 → 전설 기본
    expect(evolvedKey('rogue', 12, true, has)).toBeNull(); // 전설 그림 자체가 없음
    expect(evolvedKey('rogue', 12, false, has)).toBe('rogue');
  });

  it('시작할 때 받을 그림 — 지금 단계만', () => {
    const inM = (k: string): boolean => ['mage', 'mage_t2', 'mage_t3', 'mage@legend', 'mage@legend_t2', 'archer'].includes(k);
    const keys = unitPreloadKeys(['mage', 'archer'], inM, (u) => (u === 'mage' ? 7 : 0), (u) => (u === 'mage' ? 'legend' : null));
    expect([...keys].sort()).toEqual(['archer', 'mage', 'mage@legend_t2', 'mage_t2']);
  });
});
