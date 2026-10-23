import { describe, expect, it } from 'vitest';
import { SCREEN_W, WIDE_W, followX, fromRadar, toRadar, walkMult, worldWidth } from '../src/systems/camera';

describe('🎥 넓은 전장 · 카메라', () => {
  it('1~3관문은 화면 한 장, 그 외는 넓게', () => {
    expect(worldWidth(1, false, false)).toBe(SCREEN_W);
    expect(worldWidth(3, false, false)).toBe(SCREEN_W);
    expect(worldWidth(4, false, false)).toBe(WIDE_W);
    expect(worldWidth(1, true, false)).toBe(WIDE_W);
    expect(worldWidth(3, false, true)).toBe(WIDE_W);
  });

  it('이동 속도 보정', () => {
    expect(walkMult(SCREEN_W)).toBe(1);
    expect(walkMult(WIDE_W)).toBeCloseTo(1.3);
  });

  it('영웅을 화면 왼쪽 1/3에, 전장 밖으로 안 나감', () => {
    expect(followX(100, WIDE_W)).toBe(0);
    expect(followX(1000, WIDE_W)).toBeCloseTo(1000 - SCREEN_W / 3);
    expect(followX(2000, WIDE_W)).toBe(WIDE_W - SCREEN_W);
    expect(followX(900, SCREEN_W)).toBe(0);
  });

  it('지도 좌표 왕복', () => {
    expect(toRadar(0, WIDE_W, 430, 360)).toBe(430);
    expect(toRadar(WIDE_W, WIDE_W, 430, 360)).toBe(790);
    expect(fromRadar(610, WIDE_W, 430, 360)).toBeCloseTo(WIDE_W / 2);
  });
});
