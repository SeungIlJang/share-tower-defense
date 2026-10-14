import { describe, it, expect } from 'vitest';
import { SYNERGIES, activeSynergies, synergyMult } from '../src/systems/synergy';
import unitsData from '../src/data/units.json';

describe('유닛 조합 보너스', () => {
  it('조합에 쓰인 유닛은 모두 실제 유닛', () => {
    const units = new Set(Object.keys(unitsData));
    for (const s of SYNERGIES) for (const n of s.need) expect(units.has(n), `${s.key}:${n}`).toBe(true);
  });
  it('필요 유닛이 모두 있어야 발동', () => {
    expect(activeSynergies(['knight']).map((s) => s.key)).toEqual([]);
    expect(activeSynergies(['knight', 'shield', 'soldier']).map((s) => s.key)).toEqual(['wall']);
  });
  it('대상 유닛에만 배율 적용, 여러 조합은 곱', () => {
    const a = activeSynergies(['mage', 'darkmage', 'knight', 'shield']);
    expect(synergyMult(a, 'mage', 'atk')).toBeCloseTo(1.25);
    expect(synergyMult(a, 'knight', 'atk')).toBe(1);
    expect(synergyMult(a, 'knight', 'guard')).toBeCloseTo(0.8); // 철벽 수비는 전체
  });
});
