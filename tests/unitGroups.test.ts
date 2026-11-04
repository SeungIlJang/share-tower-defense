import { describe, expect, it } from 'vitest';
import units from '../src/data/units.json';
import { unitGroup } from '../src/systems/unitGroups';

const groupOf = (g: string): string[] => Object.entries(units as Record<string, { range: number; speed: number; role?: string }>).filter(([, u]) => unitGroup(u) === g).map(([k]) => k);

describe('🛡️ 유닛 분류', () => {
  it('근접 6 · 원거리 2 · 마법 4 · 설치물 3', () => {
    expect(groupOf('melee')).toEqual(['soldier', 'knight', 'spear', 'rogue', 'shield', 'cavalry']);
    expect(groupOf('ranged')).toEqual(['archer', 'cannon']);
    expect(groupOf('magic')).toEqual(['mage', 'cleric', 'earthmage', 'darkmage']);
    expect(groupOf('totem')).toEqual(['totem_egg', 'totem_fire', 'totem_heal']);
  });
});
