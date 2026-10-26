import { describe, expect, it } from 'vitest';
import { BASE_W, MAX_W, uiX, viewWidth } from '../src/systems/view';
import { followX } from '../src/systems/camera';

describe('📱 화면 폭', () => {
  it('16:9 이하는 1280, 넓은 휴대폰은 비율대로(최대 1600)', () => {
    expect(viewWidth(1920, 1080)).toBe(BASE_W);
    expect(viewWidth(1024, 768)).toBe(BASE_W);
    expect(viewWidth(2200, 1080)).toBe(1466);
    expect(viewWidth(3200, 1080)).toBe(MAX_W);
    expect(viewWidth(0, 0)).toBe(BASE_W);
  });
  it('짝수 폭이라 가운데 정렬 여백이 정수', () => {
    for (const w of [1900, 2100, 2340, 2400]) expect(viewWidth(w, 1080) % 2).toBe(0);
  });
  it('테스트 환경(창 없음)은 기준 폭 — 포인터 변환 그대로', () => {
    expect(uiX(100)).toBe(100);
  });
  it('카메라는 화면 폭만큼 보고 따라감', () => {
    expect(followX(2000, 2048, 1560)).toBe(2048 - 1560);
    expect(followX(900, 2048, 1560)).toBe(900 - 520);
  });
});
