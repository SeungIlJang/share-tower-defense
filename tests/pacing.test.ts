import { describe, expect, it } from 'vitest';
import { formatTime, nextUnitToBuy, summonCooldown, timeRecord } from '../src/systems/pacing';

describe('⏱️ 소환 대기 · 시간 기록 · 다음 유닛', () => {
  it('소환 대기시간 — 비쌀수록 길다', () => {
    expect(summonCooldown(20)).toBe(1.1);
    expect(summonCooldown(90)).toBe(3.2);
    expect(summonCooldown(45)).toBeGreaterThan(summonCooldown(30));
  });

  it('시간 표시', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65.9)).toBe('1:05');
    expect(formatTime(199)).toBe('3:19');
  });

  it('신기록 판정', () => {
    expect(timeRecord(undefined, 100)).toBe('first');
    expect(timeRecord(120, 100)).toBe('best');
    expect(timeRecord(90, 100)).toBeNull();
    expect(timeRecord(100, 100)).toBeNull();
  });

  it('다음에 살 유닛 = 안 산 것 중 첫 번째', () => {
    const owned = new Set(['soldier', 'archer']);
    expect(nextUnitToBuy(['soldier', 'archer', 'knight', 'spear'], (k) => owned.has(k))).toEqual({ key: 'knight', index: 2 });
    expect(nextUnitToBuy(['soldier'], () => true)).toBeNull();
  });
});
