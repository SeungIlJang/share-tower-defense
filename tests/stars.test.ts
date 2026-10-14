import { describe, it, expect } from 'vitest';
import { starsFor, newStars } from '../src/systems/stars';

describe('별 평가', () => {
  it('기지 체력 80%↑ 3개, 40%↑ 2개, 그 외 1개', () => {
    expect(starsFor(1, false)).toBe(3);
    expect(starsFor(0.8, false)).toBe(3);
    expect(starsFor(0.5, false)).toBe(2);
    expect(starsFor(0.1, false)).toBe(1);
  });
  it('부활하면 1개', () => {
    expect(starsFor(1, true)).toBe(1);
  });
  it('최고 기록보다 많을 때만 새 별', () => {
    expect(newStars(0, 3)).toBe(3);
    expect(newStars(2, 3)).toBe(1);
    expect(newStars(3, 2)).toBe(0);
  });
});
