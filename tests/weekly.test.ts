import { describe, expect, it } from 'vitest';
import { WEEKLY_STEPS, newSteps, weekIndex, weeklyBoss, weeklyStage, weeklyStageId, weeklyStepOf } from '../src/systems/weekly';
import { STAGES } from '../src/systems/worlds';
import { isBoss } from '../src/systems/bosses';
import { TITLES, earnedTitles, titleName } from '../src/systems/titles';

describe('👑 주간 보스', () => {
  it('월요일마다 주가 바뀜(1970-01-05 = 월요일)', () => {
    expect(weekIndex(3)).toBe(0); // 일요일
    expect(weekIndex(4)).toBe(1); // 월요일
    expect(weekIndex(10)).toBe(1);
    expect(weekIndex(11)).toBe(2);
  });
  it('보스는 월드 1~10 보스가 차례로', () => {
    const ten = Array.from({ length: 10 }, (_, i) => weeklyBoss(i));
    expect(new Set(ten).size).toBe(10);
    expect(weeklyBoss(10)).toBe(weeklyBoss(0));
    expect(ten.every(isBoss)).toBe(true);
  });
  it('도전 관문 = 깬 마지막 월드 보스 관문(최소 10)', () => {
    expect(weeklyStageId(10)).toBe(10);
    expect(weeklyStageId(27)).toBe(20);
    expect(weeklyStageId(100)).toBe(100);
  });
  it('관문에서 원래 보스는 빠짐', () => {
    const s = weeklyStage(STAGES.find((x) => x.id === 30)!);
    expect(s.waves.flatMap((w) => w.enemies).some((e) => isBoss(e.type))).toBe(false);
    expect(s.waves.length).toBeGreaterThan(0);
  });
  it('단계 — 누적 피해로 달성, 새로 달성한 것만', () => {
    expect(weeklyStepOf(0)).toBe(0);
    expect(weeklyStepOf(1)).toBe(2);
    expect(weeklyStepOf(99)).toBe(WEEKLY_STEPS.length);
    expect(newSteps(0.7, 2.5)).toEqual([1, 2]);
    expect(newSteps(2.5, 2.6)).toEqual([]);
  });
});

describe('🏷️ 칭호', () => {
  const base = { clearedMax: 0, endlessBest: 0, codexFound: 0, chestsOpened: 0, totalStars: 0, weeklyBest: 0 };
  it('월드 보스를 깨면 그 월드 칭호', () => {
    expect(earnedTitles(base)).toEqual([]);
    expect(earnedTitles({ ...base, clearedMax: 25 })).toEqual(['world1', 'world2']);
  });
  it('기록 칭호', () => {
    expect(earnedTitles({ ...base, endlessBest: 20, weeklyBest: 5 })).toEqual(['endless20', 'weekly5']);
    expect(titleName('world1')).toBe(TITLES[0].name);
    expect(titleName(null)).toBeNull();
  });
});
