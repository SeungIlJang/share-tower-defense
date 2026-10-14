/**
 * 유닛·특수 무기 구매(상점) — 순수 로직, Vitest 검증.
 * 처음엔 첫 번째 유닛·무기만 보유, 나머지는 강화 화면에서 메타 골드로 구매.
 * 목록 순서(units.json / WEAPONS) 뒤로 갈수록 비쌈.
 */
export const STARTER_UNIT = 'soldier';
export const STARTER_WEAPON = 'meteor';

/** index번째 유닛(0부터) 가격 — 0번은 기본 지급 */
export function unitPrice(index: number): number {
  return index <= 0 ? 0 : 150 + 120 * (index - 1);
}

/** index번째 특수 무기 가격 — 0번은 기본 지급 */
export function weaponPrice(index: number): number {
  return index <= 0 ? 0 : 250 + 150 * (index - 1);
}

/** 예전 저장 데이터 이전: 기본 1개 + 이미 강화한 것은 보유로 인정 */
export function migrateOwned(starter: string, levels: Record<string, number>): string[] {
  const owned = new Set([starter]);
  for (const [k, lv] of Object.entries(levels)) if (lv > 0) owned.add(k);
  return [...owned];
}
