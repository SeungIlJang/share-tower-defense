import { describe, expect, it } from 'vitest';
import { FEATURES, featureOn, nextTip, reachedStage, unlockedBy } from '../src/systems/tutorial';

describe('🎓 첫 경험 — 기능 단계 해금', () => {
  it('처음엔 소환만, 관문을 깰수록 하나씩', () => {
    expect(featureOn('heroSkill', reachedStage(1, 0))).toBe(false);
    expect(featureOn('heroSkill', reachedStage(2, 1))).toBe(true);
    expect(featureOn('weapon', reachedStage(2, 1))).toBe(false);
    expect(featureOn('weapon', reachedStage(3, 2))).toBe(true);
    expect(featureOn('perfect', reachedStage(5, 4))).toBe(false);
  });

  it('더 멀리 간 사람·무한 모드는 1관문을 다시 해도 전부 열림', () => {
    for (const f of FEATURES) {
      expect(featureOn(f.key, reachedStage(1, 30))).toBe(true);
      expect(featureOn(f.key, 1, true)).toBe(true);
    }
  });

  it('결과 화면 — 처음 깰 때만 다음 해금 안내', () => {
    expect(unlockedBy(2, 1)?.key).toBe('weapon');
    expect(unlockedBy(2, 5)).toBeNull();
    expect(unlockedBy(9, 8)).toBeNull();
  });

  it('👆 안내 — 안 본 것 중 조건이 맞는 첫 번째', () => {
    expect(nextTip([], { summon: true, weapon: true })).toBe('summon');
    expect(nextTip(['summon'], { summon: true, weapon: true })).toBe('weapon');
    expect(nextTip(['summon', 'weapon'], { weapon: true })).toBeNull();
  });
});
