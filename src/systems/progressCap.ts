/**
 * 🔒 진행도 강화 상한 — 유닛 강화 레벨은 '다음에 깰 관문의 권장 레벨 + LEVEL_AHEAD'까지. 순수 계산(Vitest 검증).
 * 왜: 강화가 진행도와 묶여 있지 않아, 골드를 한 유닛에 몰면 12관문(권장 Lv4)에서 Lv21 ★4를 만들 수 있었음 → 그 유닛만 뽑아도 압승.
 * 조금 앞서 가는 재미는 남김(+4). 이미 넘긴 유닛은 깎지 않고, 진행도가 따라올 때까지 강화만 멈춤(진화는 막지 않음).
 */
import { MAX_STAGE, STAGES, recommendedLevel } from './worlds';

export const LEVEL_AHEAD = 4; // 권장보다 이만큼까지 앞서 강화할 수 있음

/** 관문 id의 권장 레벨 */
function recOf(id: number): number {
  const s = STAGES[Math.min(MAX_STAGE, Math.max(1, id)) - 1];
  return recommendedLevel(s.id, s.enemyMult ?? 1);
}

/** 지금 올릴 수 있는 최고 강화 레벨 — 다음 관문(깬 최고 관문 + 1) 권장 + LEVEL_AHEAD. 끝까지 깼으면 제한 없음 */
export function progressCap(clearedMax: number): number {
  if (clearedMax >= MAX_STAGE) return Infinity;
  return recOf(clearedMax + 1) + LEVEL_AHEAD;
}

/** 이 레벨에서 한 번 더 강화하려면 깨야 하는 관문(이미 가능하면 null) */
export function stageToUnlock(level: number, clearedMax: number): number | null {
  if (level < progressCap(clearedMax)) return null;
  for (let c = clearedMax + 1; c <= MAX_STAGE; c++) if (level < progressCap(c)) return c;
  return MAX_STAGE;
}
