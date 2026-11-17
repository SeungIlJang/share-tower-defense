import { describe, expect, it } from 'vitest';
import { CHARGE_MAX, CHARGE_SHOW, HOLD_BACK, HOLD_FRONT, HOLD_FULL, HOLD_LEASH, chargeSeconds, holdGauge, holdLine, holdsHere } from '../src/systems/command';

describe('🚩 부대 명령', () => {
  it('버틴 만큼 게이지가 차고, 가득이면 멈춤', () => {
    expect(holdGauge(0)).toBe(0);
    expect(holdGauge(HOLD_FULL / 2)).toBeCloseTo(0.5, 5);
    expect(holdGauge(HOLD_FULL * 3)).toBe(1);
  });
  it('돌격 시간은 모은 만큼 — 바로 다시 누르면 효과 없음(연타 방지)', () => {
    expect(chargeSeconds(0)).toBe(0);
    expect(chargeSeconds(CHARGE_SHOW - 0.01)).toBe(0);
    expect(chargeSeconds(0.5)).toBeCloseTo(CHARGE_MAX / 2, 5);
    expect(chargeSeconds(1)).toBe(CHARGE_MAX);
  });
  it('버팀선 — 맨 앞 아군 자리, 없거나 성에 너무 가까우면 성 앞', () => {
    expect(holdLine(null, 100)).toBe(100 + HOLD_FRONT);
    expect(holdLine(900, 100)).toBe(900);
    expect(holdLine(150, 100)).toBe(100 + HOLD_FRONT);
  });
  it('버티는 중 — 자리에 올 때까지 걷고, 와서는 멈추되 가까운 적은 맞으러 나감', () => {
    expect(holdsHere(500, 800, false, null, 40)).toBe(false); // 가는 중
    expect(holdsHere(800, 800, false, null, 40)).toBe(true);
    expect(holdsHere(800 - HOLD_BACK, 800, true, null, 200)).toBe(true); // 원거리는 뒤에
    expect(holdsHere(800 - HOLD_BACK - 1, 800, true, null, 200)).toBe(false);
    expect(holdsHere(800, 800, false, 40 + HOLD_LEASH - 1, 40)).toBe(false); // 가까운 적 → 나감
    expect(holdsHere(800, 800, false, 40 + HOLD_LEASH + 1, 40)).toBe(true);
  });
});
