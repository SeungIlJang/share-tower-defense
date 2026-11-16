import { describe, expect, it } from 'vitest';
import { KILL_WINDOW, killColor, killRate, killScale, nextKillCombo } from '../src/systems/killCombo';

describe('💥 연속 처치', () => {
  it('시간 안에 또 잡으면 이어지고, 늦으면 1부터', () => {
    expect(nextKillCombo(0, 0, 5)).toBe(1);
    expect(nextKillCombo(1, 5, 5 + KILL_WINDOW)).toBe(2);
    expect(nextKillCombo(7, 5, 5 + KILL_WINDOW + 0.1)).toBe(1);
  });
  it('음정·크기는 올라가다 멈춤', () => {
    expect(killRate(1)).toBe(1);
    expect(killRate(5)).toBeGreaterThan(killRate(2));
    expect(killRate(99)).toBe(killRate(13));
    expect(killScale(3)).toBe(1);
    expect(killScale(99)).toBe(1.8);
  });
  it('색은 10·20에서 바뀜', () => {
    expect(killColor(9)).not.toBe(killColor(10));
    expect(killColor(19)).not.toBe(killColor(20));
  });
});
