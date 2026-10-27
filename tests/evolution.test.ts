import { describe, expect, it } from 'vitest';
import { MAX_TIER, UNIT_TIERS, tierBodyScale, evolvedKey, levelCap, migrateTier, nextUnitTier, readyToEvolve, starText, tierFromLevel, tierKey, tierPerks, unitOfKey, unitPreloadKeys } from '../src/systems/evolution';

describe('⭐ 유닛 진화 5단계 + 돌파', () => {
  it('단계 기준 레벨 0 · 5 · 10 · 20 · 30 … 100', () => {
    expect(UNIT_TIERS.map((t) => t.min)).toEqual([0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(MAX_TIER).toBe(11);
    expect(tierFromLevel(4)).toBe(0);
    expect(tierFromLevel(12)).toBe(2);
    expect(tierFromLevel(31)).toBe(4);
    expect(tierFromLevel(100)).toBe(11);
  });
  it('레벨은 다음 단계 시작 레벨에서 멈춤 → 진화해야 다시 강화', () => {
    expect(levelCap(0)).toBe(5);
    expect(levelCap(2)).toBe(20);
    expect(levelCap(MAX_TIER)).toBe(Infinity);
    expect(readyToEvolve(4, 0)).toBe(false);
    expect(readyToEvolve(5, 0)).toBe(true);
    expect(readyToEvolve(40, MAX_TIER)).toBe(false);
    expect(nextUnitTier(1)?.stars).toBe(3);
    expect(nextUnitTier(MAX_TIER)).toBeNull();
  });
  it('진화 비용 — ★2는 골드만, ★3부터 조각도', () => {
    expect(UNIT_TIERS[1].shards).toBe(0);
    expect(UNIT_TIERS.slice(2).every((t) => t.shards > 0 && t.gold > 0)).toBe(true);
    for (let i = 2; i < UNIT_TIERS.length; i++) expect(UNIT_TIERS[i].gold).toBeGreaterThan(UNIT_TIERS[i - 1].gold);
  });
  it('예전 저장 이전 — 이미 얻은 단계는 안 잃음', () => {
    expect(migrateTier(3)).toBe(0);
    expect(migrateTier(7)).toBe(1);
    expect(migrateTier(10)).toBe(2);
    expect(migrateTier(25)).toBe(3);
    expect(migrateTier(33)).toBe(4);
    expect(migrateTier(55)).toBe(6);
  });
  it('단계 보너스', () => {
    expect(tierPerks(0)).toEqual({ mult: 1, skillPower: 1, skillFewer: 0, atkSpeed: 1, crit: 0 });
    expect(tierPerks(2).skillPower).toBe(1.25);
    expect(tierPerks(3).skillFewer).toBe(1);
    expect(tierPerks(4).atkSpeed).toBe(1.2);
    expect(tierPerks(4).mult).toBeGreaterThan(tierPerks(3).mult);
    expect(starText(1)).toBe('★★☆☆☆');
    expect(starText(7)).toBe('★★★★★🌟3');
    expect(tierPerks(7).skillFewer).toBe(2);
    expect(tierPerks(11).crit).toBe(0.2);
    expect(tierBodyScale(2)).toBe(1);
    expect(tierBodyScale(11)).toBeLessThan(1.12);
  });

  it('그림 키 이름', () => {
    expect(tierKey('mage', false, 0)).toBe('mage');
    expect(tierKey('mage', false, 2)).toBe('mage_t3');
    expect(tierKey('mage', true, 1)).toBe('mage@legend_t2');
    expect(unitOfKey('mage@legend_t3')).toBe('mage');
    expect(unitOfKey('mage_t2')).toBe('mage');
  });

  it('그림이 없으면 아래 단계로(★4·★5는 ★3 그림)', () => {
    const has = (k: string): boolean => ['mage', 'mage_t2', 'mage_t3', 'mage@legend'].includes(k);
    expect(evolvedKey('mage', 4, false, has)).toBe('mage_t3');
    expect(evolvedKey('mage', 1, false, has)).toBe('mage_t2');
    expect(evolvedKey('mage', 0, false, has)).toBe('mage');
    expect(evolvedKey('mage', 3, true, has)).toBe('mage@legend');
    expect(evolvedKey('rogue', 3, true, has)).toBeNull();
    expect(evolvedKey('rogue', 3, false, has)).toBe('rogue');
  });

  it('시작할 때 받을 그림 — 지금 단계만', () => {
    const inM = (k: string): boolean => ['mage', 'mage_t2', 'mage_t3', 'mage@legend', 'mage@legend_t2', 'archer'].includes(k);
    const keys = unitPreloadKeys(['mage', 'archer'], inM, (u) => (u === 'mage' ? 1 : 0), (u) => (u === 'mage' ? 'legend' : null));
    expect([...keys].sort()).toEqual(['archer', 'mage', 'mage@legend_t2', 'mage_t2']);
  });
});
