/**
 * 유닛 해금(A안: 스테이지 클리어) — 순수 로직, Vitest 검증.
 * units.json 순서 = 슬롯 순서. 앞의 5종은 처음부터, 6번째부터는 스테이지를 깰 때마다 하나씩.
 * 6번째 = 2스테이지 클리어, 7번째 = 3스테이지 … 12번째 = 8스테이지 클리어.
 */
export const STARTER_UNITS = 5;

/** index번째 유닛(0부터)을 쓰려면 클리어해야 하는 스테이지(0 = 처음부터) */
export function unitUnlockStage(index: number): number {
  return index < STARTER_UNITS ? 0 : index - STARTER_UNITS + 2;
}

export function isUnitUnlocked(index: number, clearedMax: number): boolean {
  return clearedMax >= unitUnlockStage(index);
}

/** 유닛 키별 해금 스테이지(0 = 해금됨) — HUD·강화 화면 표시용 */
export function lockedUntil(keys: string[], clearedMax: number): Record<string, number> {
  const out: Record<string, number> = {};
  keys.forEach((k, i) => {
    out[k] = isUnitUnlocked(i, clearedMax) ? 0 : unitUnlockStage(i);
  });
  return out;
}
