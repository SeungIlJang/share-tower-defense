/** ⏱️ 소환 대기시간 · 클리어 시간 기록 · 다음 유닛 안내 — 순수 로직(Vitest 검증) */

/** 유닛 소환 후 같은 유닛을 다시 부를 때까지(초) — 비싼 유닛일수록 길게 */
export function summonCooldown(cost: number): number {
  return Math.round((0.5 + cost * 0.03) * 10) / 10;
}

/** 초 → '2:05' */
export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 클리어 시간 비교 — 'first'(첫 기록) / 'best'(신기록) / null(기록 못 깸) */
export function timeRecord(prev: number | undefined, now: number): 'first' | 'best' | null {
  if (prev === undefined) return 'first';
  return now < prev ? 'best' : null;
}

/** 아직 안 산 유닛 중 목록 순서상 첫 번째(=가장 싼 것) — 없으면 null */
export function nextUnitToBuy(keys: string[], owns: (k: string) => boolean): { key: string; index: number } | null {
  const index = keys.findIndex((k) => !owns(k));
  return index < 0 ? null : { key: keys[index], index };
}
