import { describe, expect, it } from 'vitest';
import units from '../src/data/units.json';
import { unitGroup } from '../src/systems/unitGroups';

const groupOf = (g: string): string[] => Object.entries(units as Record<string, { range: number; speed: number }>).filter(([, u]) => unitGroup(u) === g).map(([k]) => k);

describe('🛡️ 유닛 분류', () => {
  it('근접 6 · 원거리 6 · 설치물 3', () => {
    expect(groupOf('melee')).toEqual(['soldier', 'knight', 'spear', 'rogue', 'shield', 'cavalry']);
    expect(groupOf('ranged')).toEqual(['archer', 'mage', 'cleric', 'earthmage', 'darkmage', 'cannon']);
    expect(groupOf('totem')).toEqual(['totem_egg', 'totem_fire', 'totem_heal']);
  });
});
