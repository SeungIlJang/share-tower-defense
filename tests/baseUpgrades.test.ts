import { describe, expect, it } from 'vitest';
import { BASE_UPGRADES, baseUpgradeCost, energyMax, energyRate, popBonus } from '../src/systems/baseUpgrades';

describe('🏰 기지 강화', () => {
  it('레벨당 인구 +5, 에너지 초당 +1·상한 +10', () => {
    expect(popBonus(0)).toBe(0);
    expect(popBonus(3)).toBe(15);
    expect(energyRate(0)).toBe(9);
    expect(energyRate(4)).toBe(13);
    expect(energyMax(0)).toBe(100);
    expect(energyMax(10)).toBe(200);
  });

  it('비용은 레벨마다 120씩 증가', () => {
    expect(baseUpgradeCost(0)).toBe(150);
    expect(baseUpgradeCost(5)).toBe(750);
  });

  it('효과 설명', () => {
    expect(BASE_UPGRADES.find((b) => b.key === 'pop')!.effect(2)).toBe('최대 인구 50');
    expect(BASE_UPGRADES.find((b) => b.key === 'energy')!.effect(1)).toBe('에너지 초당 10 · 최대 110');
  });
});
