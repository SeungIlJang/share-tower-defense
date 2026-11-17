/**
 * 🚩 부대 명령 — 버티기(모으기) → 돌격(터뜨리기). 순수 로직(Vitest 검증).
 * - 버티기: 아군이 버팀선에서 멈춰 모임(가까이 온 적은 그대로 상대). 버티는 동안 받는 피해 ↓, 돌격 게이지가 참
 * - 돌격: 모은 시간만큼 오래, 빨리 달리고 세게·빨리 때림 — 바로 다시 누르면 게이지가 없어 효과도 없음(연타 방지)
 */
export type Stance = 'advance' | 'hold';

export const HOLD_FULL = 8; // 이만큼(초) 버티면 게이지 가득
export const HOLD_GUARD = 0.8; // 버티는 동안 받는 피해 배수
export const HOLD_LEASH = 150; // 버팀선에 선 유닛이 적을 맞으러 나가는 거리(사거리 밖 px)
export const HOLD_FRONT = 320; // 전장에 아군이 없을 때 버팀선 — 우리 성 앞 이만큼
export const HOLD_BACK = 70; // 원거리 유닛은 버팀선보다 이만큼 뒤에 섬
export const CHARGE_MAX = 7; // 게이지 가득일 때 돌격 시간(초)
export const CHARGE_MOVE = 1.7; // 돌격 중 이동 속도 배수
export const CHARGE_ATK = 1.25; // 〃 공격력 배수
export const CHARGE_HASTE = 1.25; // 〃 공격 속도 배수
export const CHARGE_SHOW = 0.15; // 게이지가 이보다 적으면 '돌격' 효과 없이 전진만

/** 버틴 시간 → 게이지(0~1) */
export function holdGauge(heldSec: number): number {
  return Math.min(1, Math.max(0, heldSec / HOLD_FULL));
}

/** 게이지 → 돌격 시간(초) — 조금 모았으면 0 */
export function chargeSeconds(gauge: number): number {
  return gauge < CHARGE_SHOW ? 0 : CHARGE_MAX * Math.min(1, gauge);
}

/** 버팀선 — 맨 앞 아군 자리(없으면 성 앞) */
export function holdLine(frontX: number | null, baseX: number): number {
  return frontX === null ? baseX + HOLD_FRONT : Math.max(frontX, baseX + HOLD_FRONT);
}

/** 버티는 중 이 유닛이 멈춰야 하나 — 자기 자리에 왔고, 맞으러 나갈 만큼 가까운 적이 없을 때 */
export function holdsHere(x: number, line: number, ranged: boolean, enemyGap: number | null, range: number): boolean {
  if (x < line - (ranged ? HOLD_BACK : 0)) return false; // 아직 자리로 가는 중
  return enemyGap === null || enemyGap > range + HOLD_LEASH;
}
