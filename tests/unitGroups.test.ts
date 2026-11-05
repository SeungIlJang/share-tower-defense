import { describe, expect, it } from 'vitest';
import units from '../src/data/units.json';
import { unitGroup } from '../src/systems/unitGroups';

const groupOf = (g: string): string[] => Object.entries(units as Record<string, { range: number; speed: number; hp: number; role?: string }>).filter(([, u]) => unitGroup(u) === g).map(([k]) => k);

describe('🛡️ 유닛 분류', () => {
  it('보병 3 · 정예 3 · 원거리 2 · 마법 4 · 설치물 3', () => {
    expect(groupOf('infantry')).toEqual(['soldier', 'spear', 'rogue']);
    expect(groupOf('elite')).toEqual(['knight', 'shield', 'cavalry']);
    expect(groupOf('ranged')).toEqual(['archer', 'cannon']);
    expect(groupOf('magic')).toEqual(['mage', 'cleric', 'earthmage', 'darkmage']);
    expect(groupOf('totem')).toEqual(['totem_egg', 'totem_fire', 'totem_heal']);
  });
});
