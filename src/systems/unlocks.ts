/**
 * 유닛·특수 무기 구매(상점) — 순수 로직, Vitest 검증.
 * 처음엔 병사·궁수와 첫 번째 무기 보유, 첫 3관문을 깰 때마다 유닛 하나를 선물(STAGE_GIFT). 나머지는 강화 화면에서 메타 골드로 구매.
 * 목록 순서(units.json / WEAPONS) 뒤로 갈수록 비쌈.
 */
export const STARTER_UNIT = 'soldier';
export const STARTER_WEAPON = 'meteor';
/** 처음부터 가진 유닛 — 카드가 한 장뿐이면 고를 게 없어서 두 장으로 시작 */
export const STARTER_UNITS = ['soldier', 'archer'];
/** 🎁 이 관문을 처음 깨면 받는 유닛 — '다음 판에 써 보고 싶다'가 다음 판을 누르는 이유 */
export const STAGE_GIFT: Record<number, string> = { 1: 'knight', 2: 'spear', 3: 'mage' };

/** 이번 클리어로 받을 선물 유닛(처음 깰 때만 · 이미 가졌으면 없음) */
export function stageGift(stageId: number, prevClearedMax: number, owns: (k: string) => boolean): string | null {
  if (stageId <= prevClearedMax) return null;
  const k = STAGE_GIFT[stageId];
  return k && !owns(k) ? k : null;
}

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
