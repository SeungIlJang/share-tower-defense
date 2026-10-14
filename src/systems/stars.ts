/** ⭐ 스테이지 별 평가(순수 로직) — 우리 기지 남은 체력 기준, 부활했으면 1개 */

export const STAR_GOLD = 40; // 처음 얻는 별 1개당 보너스 골드

export function starsFor(baseHpRatio: number, revived: boolean): number {
  if (revived) return 1;
  if (baseHpRatio >= 0.8) return 3;
  if (baseHpRatio >= 0.4) return 2;
  return 1;
}

/** 새로 얻은 별 수(이전 최고 기록보다 많을 때만) */
export function newStars(prevBest: number, got: number): number {
  return Math.max(0, got - prevBest);
}
