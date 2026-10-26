/**
 * 📱 화면 폭 — 높이 720 고정, 폭은 기기 비율대로(16:9 = 1280 ~ 20:9 ≈ 1600). 순수 계산(Vitest 검증).
 * 화면(메뉴·창·HUD)은 1280 기준으로 만들고 가운데에 둠 → 양옆이 넓어지면 VIEW_L~VIEW_R까지 보임.
 * 전투는 전장 카메라가 VIEW_W만큼 보여 줌(넓은 휴대폰 = 전장이 더 보임).
 */
export const BASE_W = 1280;
export const MAX_W = 1600;

/** 창 크기 → 게임 폭(짝수, 1280~1600) */
export function viewWidth(w: number, h: number): number {
  if (!(w > 0 && h > 0)) return BASE_W;
  return Math.min(MAX_W, Math.max(BASE_W, Math.round((720 * w) / h / 2) * 2));
}

const win = typeof window !== 'undefined' ? window : null;
export const VIEW_W = win ? viewWidth(win.innerWidth, win.innerHeight) : BASE_W;
export const VIEW_OFF = (VIEW_W - BASE_W) / 2; // 1280 기준 화면이 가운데로 밀린 양
export const VIEW_L = -VIEW_OFF; // 1280 좌표로 본 화면 왼쪽 끝
export const VIEW_R = BASE_W + VIEW_OFF; // 〃 오른쪽 끝

/** 화면(포인터) x → 1280 기준 화면 x */
export function uiX(screenX: number): number {
  return screenX - VIEW_OFF;
}
