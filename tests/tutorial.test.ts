import { describe, expect, it } from 'vitest';
import { FEATURES, featureOn, nextTip, reachedStage, unlockedBy } from '../src/systems/tutorial';

describe('🎓 첫 경험 — 기능 단계 해금', () => {
  it('1관문부터 소환 + 특수 무기, 관문을 깰수록 더 열림(3관문 전에 카드·성 공격까지)', () => {
    expect(featureOn('weapon', reachedStage(1, 0))).toBe(true);
    expect(featureOn('heroSkill', reachedStage(1, 0))).toBe(false);
    expect(featureOn('heroSkill', reachedStage(2, 1))).toBe(true);
    expect(featureOn('levelup', reachedStage(1, 0))).toBe(false);
    expect(featureOn('levelup', reachedStage(2, 1))).toBe(true);
    expect(featureOn('volley', reachedStage(3, 2))).toBe(true);
    expect(featureOn('perfect', reachedStage(3, 2))).toBe(false);
    expect(featureOn('perfect', reachedStage(4, 3))).toBe(true);
    expect(featureOn('command', reachedStage(4, 3))).toBe(false); // 🚩 부대 명령은 5관문부터(웨이브 모양과 함께)
    expect(featureOn('command', reachedStage(5, 4))).toBe(true);
  });

  it('더 멀리 간 사람·무한 모드는 1관문을 다시 해도 전부 열림', () => {
    for (const f of FEATURES) {
      expect(featureOn(f.key, reachedStage(1, 30))).toBe(true);
      expect(featureOn(f.key, 1, true)).toBe(true);
    }
  });

  it('결과 화면 — 처음 깰 때만 다음 해금 안내', () => {
    expect(unlockedBy(1, 0).map((f) => f.key)).toEqual(['heroSkill', 'levelup']);
    expect(unlockedBy(2, 1).map((f) => f.key)).toEqual(['volley']);
    expect(unlockedBy(2, 5)).toEqual([]);
    expect(unlockedBy(9, 8)).toEqual([]);
  });

  it('👆 안내 — 안 본 것 중 조건이 맞는 첫 번째', () => {
    expect(nextTip([], { summon: true, weapon: true })).toBe('summon');
    expect(nextTip(['summon'], { summon: true, weapon: true })).toBe('weapon');
    expect(nextTip(['summon', 'weapon'], { weapon: true })).toBeNull();
  });
});
