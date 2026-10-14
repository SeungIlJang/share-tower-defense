import { describe, it, expect } from 'vitest';
import { unitUnlockStage, isUnitUnlocked, lockedUntil } from '../src/systems/unlocks';

describe('유닛 해금(스테이지 클리어)', () => {
  it('앞의 5종은 처음부터', () => {
    for (let i = 0; i < 5; i++) expect(unitUnlockStage(i)).toBe(0);
    expect(isUnitUnlocked(4, 0)).toBe(true);
  });
  it('6번째 = 2스테이지, 12번째 = 8스테이지 클리어', () => {
    expect(unitUnlockStage(5)).toBe(2);
    expect(unitUnlockStage(11)).toBe(8);
  });
  it('클리어한 최고 스테이지로 판정', () => {
    expect(isUnitUnlocked(5, 1)).toBe(false);
    expect(isUnitUnlocked(5, 2)).toBe(true);
  });
  it('lockedUntil — 해금된 유닛은 0', () => {
    const keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    expect(lockedUntil(keys, 2, false)).toEqual({ a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 3 });
  });
  it('전체 해금 스위치 — 전부 0', () => {
    expect(lockedUntil(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 0, true)).toEqual({ a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, g: 0 });
  });
});
