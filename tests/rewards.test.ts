import { describe, it, expect } from 'vitest';
import { dailyAmount, idleAmount } from '../src/systems/upgrades';

describe('daily reward', () => {
  it('day 1 (streak 0) = 50', () => {
    expect(dailyAmount(0)).toBe(50);
  });
  it('grows 25 per streak day', () => {
    expect(dailyAmount(1)).toBe(75);
    expect(dailyAmount(3)).toBe(125);
  });
  it('caps at streak 6 → 200', () => {
    expect(dailyAmount(6)).toBe(200);
    expect(dailyAmount(10)).toBe(200);
  });
});

describe('idle reward', () => {
  const H = 3600_000;
  it('zero for no elapsed time', () => {
    expect(idleAmount(0, 60, 8)).toBe(0);
    expect(idleAmount(-5000, 60, 8)).toBe(0);
  });
  it('accrues per hour', () => {
    expect(idleAmount(1 * H, 60, 8)).toBe(60);
    expect(idleAmount(2 * H, 60, 8)).toBe(120);
  });
  it('floors partial hours', () => {
    expect(idleAmount(1.5 * H, 60, 8)).toBe(90);
    expect(idleAmount(0.5 * H, 60, 8)).toBe(30);
  });
  it('caps at cap hours', () => {
    expect(idleAmount(20 * H, 60, 8)).toBe(480);
  });
});
