import { describe, expect, it } from 'vitest';
import { LEVEL_AHEAD, progressCap, stageToUnlock } from '../src/systems/progressCap';
import { STAGES, recommendedLevel } from '../src/systems/worlds';

describe('🔒 진행도 강화 상한', () => {
  it('다음에 깰 관문의 권장 레벨 + 4까지', () => {
    expect(LEVEL_AHEAD).toBe(4);
    expect(progressCap(0)).toBe(5); // 처음 시작 — ★2 진화(Lv5)까지는 바로
    expect(progressCap(11)).toBe(8); // 12관문을 깨려는 사람 = Lv8까지(Lv21은 못 만듦)
    for (let c = 0; c < 100; c++) {
      const s = STAGES[c];
      expect(progressCap(c)).toBe(recommendedLevel(s.id, s.enemyMult ?? 1) + LEVEL_AHEAD);
      if (c > 0) expect(progressCap(c)).toBeGreaterThanOrEqual(progressCap(c - 1)); // 깰수록 늘기만
    }
    expect(progressCap(100)).toBe(Infinity); // 끝까지 깼으면 제한 없음
  });

  it('막혔을 때 깨야 할 관문을 알려 줌', () => {
    expect(stageToUnlock(4, 0)).toBeNull();
    expect(stageToUnlock(7, 11)).toBeNull();
    const need = stageToUnlock(8, 11)!;
    expect(need).toBeGreaterThan(11);
    expect(progressCap(need)).toBeGreaterThan(8);
    expect(progressCap(need - 1)).toBeLessThanOrEqual(8);
    expect(stageToUnlock(21, 11)).toBeGreaterThan(20); // 이미 넘긴 유닛 — 한참 더 깨야 다시 강화
  });
});
