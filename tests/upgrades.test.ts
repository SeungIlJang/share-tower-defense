import { describe, it, expect } from 'vitest';
import { upgradeCost, scaleStat, applyUpgrade } from '../src/systems/upgrades';
import type { UnitStats } from '../src/types';

describe('upgrades', () => {
  it('강화 비용은 레벨에 따라 증가', () => {
    expect(upgradeCost(0)).toBe(100);
    expect(upgradeCost(1)).toBe(180);
    expect(upgradeCost(3)).toBe(340);
  });

  it('스탯은 레벨당 +15%', () => {
    expect(scaleStat(100, 0)).toBe(100);
    expect(scaleStat(100, 1)).toBe(115);
    expect(scaleStat(100, 2)).toBe(130);
  });

  it('applyUpgrade는 hp·atk만 올리고 나머지 유지', () => {
    const base: UnitStats = {
      name: '병사',
      hp: 100,
      atk: 20,
      def: 5,
      atkSpeed: 1,
      range: 44,
      speed: 70,
      cost: 50,
      pop: 8,
    };
    const up = applyUpgrade(base, 2);
    expect(up.hp).toBe(130);
    expect(up.atk).toBe(26);
    expect(up.def).toBe(5); // 불변
    expect(up.cost).toBe(50);
    expect(applyUpgrade(base, 0)).toBe(base); // 0레벨은 원본
  });
});
