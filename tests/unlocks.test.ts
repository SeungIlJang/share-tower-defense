import { describe, it, expect } from 'vitest';
import { unitPrice, weaponPrice, migrateOwned, stageGift, STAGE_GIFT, STARTER_UNIT, STARTER_UNITS, STARTER_WEAPON } from '../src/systems/unlocks';
import unitsData from '../src/data/units.json';
import { WEAPONS } from '../src/systems/weapons';

describe('유닛·무기 구매', () => {
  it('기본 지급은 목록 첫 번째', () => {
    expect(Object.keys(unitsData)[0]).toBe(STARTER_UNIT);
    expect(WEAPONS[0].key).toBe(STARTER_WEAPON);
  });
  it('첫 번째는 무료, 뒤로 갈수록 비쌈', () => {
    expect(unitPrice(0)).toBe(0);
    expect(unitPrice(1)).toBe(150);
    expect(unitPrice(11)).toBe(1350);
    expect(weaponPrice(0)).toBe(0);
    expect(weaponPrice(1)).toBe(250);
    expect(weaponPrice(8)).toBe(1300);
  });
  it('🎁 기본 유닛 2장 + 첫 3관문 선물은 실제 있는 유닛', () => {
    expect(STARTER_UNITS[0]).toBe(STARTER_UNIT);
    for (const k of [...STARTER_UNITS, ...Object.values(STAGE_GIFT)]) expect(unitsData).toHaveProperty(k);
  });
  it('🎁 선물은 처음 깰 때만, 이미 가졌으면 없음', () => {
    expect(stageGift(1, 0, () => false)).toBe('knight');
    expect(stageGift(1, 3, () => false)).toBeNull();
    expect(stageGift(2, 1, (k) => k === 'spear')).toBeNull();
    expect(stageGift(4, 3, () => false)).toBeNull();
  });
  it('예전 저장: 기본 + 강화한 것 보유', () => {
    expect(migrateOwned('soldier', {}).sort()).toEqual(['soldier']);
    expect(migrateOwned('soldier', { knight: 2, mage: 0 }).sort()).toEqual(['knight', 'soldier']);
  });
});
