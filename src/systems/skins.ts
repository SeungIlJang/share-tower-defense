/**
 * 👗 레어 스킨 — 그림 없이 '대표 옷 색'만 다른 색으로 바꿈(피부·머리·가죽은 그대로).
 * 순수 로직(Vitest 검증). 실제 텍스처 생성은 skinTextures.ts.
 */

export interface HueSwap {
  from: [number, number]; // 바꿀 색상 범위(도, 0~360, 넘어가면 360을 감싸는 범위)
  to: number; // 범위 가운데 색이 이 색상이 됨(나머지는 같은 차이만큼 이동)
  minSat?: number; // 이보다 채도 낮은 픽셀은 안 바꿈(기본 0.3)
}

export interface Skin {
  id: string; // 'rare' | 'legend'
  name: string;
  grade: 'rare' | 'legend';
  price: number;
  swaps: HueSwap[]; // 레어: 색 바꾸기(전설은 그림이라 비어 있음)
}

export const RARE_PRICE = 500;
export const LEGEND_PRICE = 1500;

/** 🟡 전설 스킨 이름 — 그림(public/sprites/<유닛>@legend)이 있을 때만 판매 */
export const LEGEND_NAMES: Record<string, string> = {
  soldier: '황금 사자',
  archer: '달빛 레인저',
  knight: '성기사',
  spear: '용창 기사',
  mage: '별빛 대마법사',
  rogue: '그림자 암살자',
  cleric: '천사 성녀',
  earthmage: '고대 드루이드',
  darkmage: '공허의 마녀',
  shield: '요새 수호자',
  cavalry: '왕실 기병',
  cannon: '스팀펑크 기술자',
};

/** 유닛이 가질 수 있는 스킨 목록(레어 + 그림이 있으면 전설) */
export function skinsFor(type: string, hasLegendArt: boolean): Skin[] {
  const out: Skin[] = [];
  if (SKINS[type]) out.push(SKINS[type]);
  if (hasLegendArt && LEGEND_NAMES[type]) out.push({ id: 'legend', name: LEGEND_NAMES[type], grade: 'legend', price: LEGEND_PRICE, swaps: [] });
  return out;
}

const rare = (name: string, swaps: HueSwap[]): Skin => ({ id: 'rare', name, grade: 'rare', price: RARE_PRICE, swaps });

/** 유닛별 레어 스킨 */
export const SKINS: Record<string, Skin> = {
  soldier: rare('진홍 전사', [
    { from: [345, 12], to: 210, minSat: 0.45 },
    { from: [200, 240], to: 352 },
  ]),
  archer: rare('물빛 레인저', [{ from: [60, 170], to: 200, minSat: 0.18 }]),
  knight: rare('붉은 기사', [{ from: [200, 245], to: 355 }]),
  spear: rare('벚꽃 창병', [{ from: [172, 212], to: 320 }]),
  mage: rare('숲의 마녀', [{ from: [245, 295], to: 135 }]),
  rogue: rare('핏빛 자객', [{ from: [60, 175], to: 352, minSat: 0.1 }]),
  cleric: rare('벚꽃 성녀', [{ from: [198, 240], to: 330 }]),
  earthmage: rare('물의 현자', [
    { from: [36, 62], to: 200, minSat: 0.5 },
    { from: [62, 180], to: 215, minSat: 0.05 },
  ]),
  darkmage: rare('서리 마녀', [{ from: [250, 340], to: 185 }]),
  shield: rare('적철 수호자', [{ from: [210, 250], to: 355 }]),
  cavalry: rare('청룡 기병', [{ from: [340, 12], to: 215, minSat: 0.45 }]),
  cannon: rare('숲 포병', [{ from: [200, 250], to: 130 }]),
};

/** 범위 안인가(360 감싸기 포함) */
export function inHueRange(h: number, [a, b]: [number, number]): boolean {
  return a <= b ? h >= a && h <= b : h >= a || h <= b;
}

function rangeCenter([a, b]: [number, number]): number {
  const span = a <= b ? b - a : 360 - a + b;
  return (a + span / 2) % 360;
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let h = 0;
  if (d > 0) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, mx === 0 ? 0 : d / mx, mx / 255];
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

/** 픽셀 하나 색 바꾸기 — 범위 밖이면 그대로 */
export function recolor(r: number, g: number, b: number, swaps: HueSwap[]): [number, number, number] {
  const [h, s, v] = rgbToHsv(r, g, b);
  for (const sw of swaps) {
    if (s < (sw.minSat ?? 0.3) || v < 0.12 || !inHueRange(h, sw.from)) continue;
    let d = h - rangeCenter(sw.from);
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    const nh = (((sw.to + d) % 360) + 360) % 360;
    return hsvToRgb(nh, s, v);
  }
  return [r, g, b];
}

/** RGBA 바이트 배열 통째로 색 바꾸기(제자리) */
export function recolorPixels(data: Uint8ClampedArray, swaps: HueSwap[]): void {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    const [r, g, b] = recolor(data[i], data[i + 1], data[i + 2], swaps);
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
}

/** 스킨 적용 텍스처·애니메이션 이름 접미사 */
export function skinType(type: string, skin: string | null | undefined): string {
  return skin ? `${type}@${skin}` : type;
}
