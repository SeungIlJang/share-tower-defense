/**
 * 🔥 PERFECT 체인 — 연속 PERFECT 소환 수에 따른 보상. 순수 로직(Vitest 검증).
 * 3연속마다 다음 소환 무료 · 5연속마다 성 특수 공격 게이지 +20%. 한 번이라도 빗나가면 0.
 */
export const CHAIN_FREE_EVERY = 3; // 이 배수마다 🎁 무료 소환 1회
export const CHAIN_VOLLEY_EVERY = 5; // 이 배수마다 🏰 발리 게이지 +20%
export const CHAIN_VOLLEY_PCT = 0.2;
export const CHAIN_SHOW_FROM = 2; // 이 수부터 화면에 "×N CHAIN!"

export interface ChainReward {
  free: boolean;
  volley: boolean;
}

/** 소환 결과 반영 — PERFECT면 +1, 아니면 0 */
export function nextChain(chain: number, perfect: boolean): number {
  return perfect ? chain + 1 : 0;
}

/** 이번 체인 수에서 받는 보상 */
export function chainReward(chain: number): ChainReward {
  return { free: chain > 0 && chain % CHAIN_FREE_EVERY === 0, volley: chain > 0 && chain % CHAIN_VOLLEY_EVERY === 0 };
}

/** 체인에 따라 소환 효과음 음정이 올라감(도·레·미… 8단계까지) */
export function chainRate(chain: number): number {
  return 1 + 0.07 * Math.min(8, Math.max(0, chain - 1));
}

/** "×N CHAIN!" 글씨 크기 배율(커질수록 크게, 2.2배까지) */
export function chainScale(chain: number): number {
  return Math.min(2.2, 1 + 0.12 * (chain - CHAIN_SHOW_FROM));
}
