import { describe, expect, it } from 'vitest';
import { EQUIP_DROP, HERO_WEAPONS, RINGS, equipDef, equipUpCost, isWeapon, ringMult, ringPct, rollEquip, weaponPower } from '../src/systems/equipment';
import { TOTEMS, totemX } from '../src/systems/totems';
import unitsData from '../src/data/units.json';
import manifest from '../public/sprites/manifest.json';

describe('🛡️ 영웅 장비', () => {
  it('무기 6 · 반지 6, 아이콘 프레임 0~5', () => {
    expect(HERO_WEAPONS.map((w) => w.frame)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(RINGS.map((r) => r.frame)).toEqual([0, 1, 2, 3, 4, 5]);
    expect((manifest as unknown as Record<string, { anims: { idle: { frames: number[] } } }>).equip_weapon_icons.anims.idle.frames).toHaveLength(6);
  });

  it('등급 효과 · 강화 비용', () => {
    expect(weaponPower(1)).toBe(1);
    expect(weaponPower(5)).toBeCloseTo(1.6);
    expect(ringPct('ring_gold', 3)).toBe(15);
    expect(ringMult('ring_gold', 3, 'ring_gold')).toBeCloseTo(1.15);
    expect(ringMult('ring_exp', 3, 'ring_gold')).toBe(1);
    expect(ringMult(null, 0, 'ring_gold')).toBe(1);
    expect([1, 2, 4, 5].map(equipUpCost)).toEqual([300, 1200, 4800, null]);
  });

  it('상자 드롭 — 전설 상자는 반드시, 기본 철퇴는 안 나옴', () => {
    expect(EQUIP_DROP[3]).toBe(1);
    for (let i = 0; i < 50; i++) {
      const k = rollEquip(3, Math.random);
      expect(k).not.toBeNull();
      expect(k).not.toBe('mace');
      expect(equipDef(k!)).not.toBeNull();
    }
    expect(rollEquip(0, () => 0.99)).toBeNull();
    expect(isWeapon('frost_mace')).toBe(true);
    expect(isWeapon('ring_exp')).toBe(false);
  });
});

describe('🗿 설치물', () => {
  it('3종 모두 유닛 데이터 · 그림(등장·대기·공격·사라짐)', () => {
    const U = unitsData as Record<string, { speed: number }>;
    const M = manifest as unknown as Record<string, { anims: Record<string, unknown> }>;
    for (const k of Object.keys(TOTEMS)) {
      expect(U[k].speed, k).toBe(0);
      expect(Object.keys(M[k].anims).sort(), k).toEqual(['attack', 'death', 'idle', 'skill']);
    }
  });

  it('설치 위치 — 영웅 앞, 범위 안', () => {
    expect(totemX(500, 180, 1800)).toBe(540);
    expect(totemX(null, 180, 1800)).toBe(220);
    expect(totemX(1790, 180, 1800)).toBe(1800);
  });
});
