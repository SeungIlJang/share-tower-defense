/**
 * 📣 지원군 — 전투 중 덱에 없는 보유 유닛을 부름.
 * 한 판에 무료 1번(1마리) + 광고 보고 1번(3마리). 지원군은 인구를 차지하지 않음.
 */
export const REINFORCE_FREE = 1; // 한 판 무료 횟수
export const REINFORCE_AD = 1; // 광고로 더 부를 수 있는 횟수
export const REINFORCE_FREE_COUNT = 1; // 무료로 오는 수
export const REINFORCE_AD_COUNT = 3; // 광고 보면 오는 수

/** 이번 호출로 오는 수 */
export function reinforceCount(byAd: boolean): number {
  return byAd ? REINFORCE_AD_COUNT : REINFORCE_FREE_COUNT;
}
