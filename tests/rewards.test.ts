import { describe, it, expect } from 'vitest';
import { dailyAmount, idleAmount, localDayIndex } from '../src/systems/upgrades';

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

describe('localDayIndex', () => {
  const KST = -540; // UTC+9
  it('KST 자정에 날짜가 바뀐다', () => {
    const before = Date.UTC(2026, 9, 13, 14, 59); // KST 10/13 23:59
    const after = Date.UTC(2026, 9, 13, 15, 0); // KST 10/14 00:00
    expect(localDayIndex(after, KST)).toBe(localDayIndex(before, KST) + 1);
  });
  it('UTC 자정(KST 09:00)에는 날짜가 바뀌지 않는다', () => {
    const before = Date.UTC(2026, 9, 13, 23, 59); // KST 10/14 08:59
    const after = Date.UTC(2026, 9, 14, 0, 0); // KST 10/14 09:00
    expect(localDayIndex(after, KST)).toBe(localDayIndex(before, KST));
  });
});
