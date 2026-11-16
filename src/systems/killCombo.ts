/**
 * 💥 연속 처치 — 적을 잇달아 잡으면 "×N KILL!"이 커지고 동전 소리 음정이 올라감. 순수 로직(Vitest 검증).
 * 잡는 맛(경쾌함)을 위한 장치 — 보상은 없음, 표시와 소리만.
 */
export const KILL_WINDOW = 2.2; // 이 시간(초) 안에 또 잡으면 이어짐
export const KILL_SHOW_FROM = 3; // 이 수부터 화면에 표시
export const HIT_STOP_MS = 70; // 큰 적(엘리트·보스)을 잡는 순간 아주 잠깐 멈춤

/** 처치 반영 — 마지막 처치 후 window 안이면 +1, 아니면 1부터 */
export function nextKillCombo(combo: number, lastAt: number, now: number, window = KILL_WINDOW): number {
  return combo > 0 && now - lastAt <= window ? combo + 1 : 1;
}

/** 동전 소리 음정(도·레·미… 12단계까지) */
export function killRate(combo: number): number {
  return 1 + 0.06 * Math.min(12, Math.max(0, combo - 1));
}

/** 글씨 크기 배율(1 → 1.8) */
export function killScale(combo: number): number {
  return Math.min(1.8, 1 + 0.04 * Math.max(0, combo - KILL_SHOW_FROM));
}

/** 글씨 색 — 10부터 주황, 20부터 분홍 */
export function killColor(combo: number): string {
  return combo >= 20 ? '#ff7af0' : combo >= 10 ? '#ff9a3c' : '#ffe14d';
}
