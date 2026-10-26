/**
 * 🎥 넓은 전장 + 카메라 — 순수 계산(Vitest 검증). 분석: docs/paladog-apk-analysis.md 7장
 * 팔라독처럼 전장이 화면보다 넓고, 카메라는 영웅을 화면 왼쪽 1/3에 두고 따라감.
 * 1~3관문(첫 경험)은 화면 한 장 그대로 — 양쪽 성이 다 보여야 이해가 쉬움.
 */
export const SCREEN_W = 1280;
export const WIDE_W = 2048; // 화면의 1.6배

/** 전장 폭 — 1~3관문은 화면 한 장, 그 외(무한·도전 포함)는 넓은 전장 */
export function worldWidth(stageId: number, endless: boolean, daily: boolean): number {
  return !endless && !daily && stageId <= 3 ? SCREEN_W : WIDE_W;
}

/** 넓어진 만큼 이동 속도 보정(판이 너무 길어지지 않게) — 1.6배 전장 = ×1.3 */
export function walkMult(w: number): number {
  return 1 + 0.5 * (w / SCREEN_W - 1);
}

/** 카메라 왼쪽 끝 — 영웅을 화면 왼쪽 1/3에, 전장 밖으로는 안 나감 */
export function followX(heroX: number, w: number, view = SCREEN_W): number {
  return Math.min(Math.max(0, w - view), Math.max(0, heroX - view / 3));
}

/** 전장 지도(레이더) — 전장 x ↔ 지도 x */
export function toRadar(x: number, w: number, rx: number, rw: number): number {
  return rx + (Math.min(Math.max(0, x), w) / w) * rw;
}
export function fromRadar(px: number, w: number, rx: number, rw: number): number {
  return (Math.min(Math.max(0, px - rx), rw) / rw) * w;
}

/** 둘러보기 후 자동 복귀(초) */
export const LOOK_HOLD = 3;
