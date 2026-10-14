import { describe, it, expect } from 'vitest';
import {
  WeaponCharge,
  meteorTarget,
  lightningTargets,
  snipeTarget,
  unlockedWeapons,
  WEAPONS,
} from '../src/systems/weapons';

describe('WeaponCharge', () => {
  it('시간이 지나면 차고, 가득 차기 전엔 발사 불가', () => {
    const w = new WeaponCharge(20);
    w.update(10);
    expect(w.ratio).toBeCloseTo(0.5);
    expect(w.ready).toBe(false);
    expect(w.fire()).toBe(false);
  });
  it('가득 차면 발사 → 0부터 다시', () => {
    const w = new WeaponCharge(20);
    w.update(25);
    expect(w.ratio).toBe(1); // 상한
    expect(w.fire()).toBe(true);
    expect(w.ratio).toBe(0);
    expect(w.fire()).toBe(false);
  });
});

describe('무기 목록·해금', () => {
  it('9종, 키 중복 없음', () => {
    expect(WEAPONS).toHaveLength(9);
    expect(new Set(WEAPONS.map((w) => w.key)).size).toBe(9);
  });
  it('스테이지 N → N개(1~9로 제한)', () => {
    expect(unlockedWeapons(1)).toBe(1);
    expect(unlockedWeapons(5)).toBe(5);
    expect(unlockedWeapons(10)).toBe(9);
    expect(unlockedWeapons(0)).toBe(1);
  });
});

describe('무기 대상', () => {
  it('메테오: 적이 없으면 null, 앞쪽 적 무리 평균', () => {
    expect(meteorTarget([])).toBeNull();
    expect(meteorTarget([500, 520, 540, 900], 110)).toBeCloseTo(520); // 900은 멀어서 제외
  });
  it('번개: 기지에 가까운(x 작은) 순서로 n개', () => {
    expect(lightningTargets([800, 300, 600, 400], 2)).toEqual([1, 3]);
    expect(lightningTargets([800], 5)).toEqual([0]);
  });
  it('저격: HP 최대인 적, 없으면 -1', () => {
    expect(snipeTarget([90, 1400, 220])).toBe(1);
    expect(snipeTarget([])).toBe(-1);
  });
});
