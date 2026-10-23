import { describe, it, expect } from 'vitest';
import { isTotem } from '../src/systems/totems';
import { SKINS, recolor, rgbToHsv, inHueRange, skinType } from '../src/systems/skins';
import unitsData from '../src/data/units.json';

describe('레어 스킨', () => {
  it('유닛 12종 모두(설치물 제외) 레어 스킨', () => {
    for (const k of Object.keys(unitsData).filter((u) => !isTotem(u))) expect(SKINS[k], k).toBeDefined();
  });
  it('360을 감싸는 색상 범위', () => {
    expect(inHueRange(350, [345, 12])).toBe(true);
    expect(inHueRange(5, [345, 12])).toBe(true);
    expect(inHueRange(30, [345, 12])).toBe(false);
  });
  it('대표 색만 바뀌고 피부색은 그대로', () => {
    const swaps = SKINS.knight.swaps; // 파랑 → 빨강
    const blue = recolor(40, 80, 220, swaps);
    expect(rgbToHsv(...blue)[0]).toBeGreaterThan(330); // 빨강 쪽
    expect(recolor(240, 200, 170, swaps)).toEqual([240, 200, 170]); // 살구색 피부
    expect(recolor(128, 128, 128, swaps)).toEqual([128, 128, 128]); // 회색(채도 없음)
  });
  it('밝기·채도는 유지', () => {
    const [, s0, v0] = rgbToHsv(40, 80, 220);
    const [, s1, v1] = rgbToHsv(...recolor(40, 80, 220, SKINS.knight.swaps));
    expect(s1).toBeCloseTo(s0, 1);
    expect(v1).toBeCloseTo(v0, 1);
  });
  it('스킨 텍스처 이름', () => {
    expect(skinType('knight', 'rare')).toBe('knight@rare');
    expect(skinType('knight', null)).toBe('knight');
  });
});
