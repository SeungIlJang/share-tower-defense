import { describe, it, expect } from 'vitest';
import { dailyMissions, addStats, missionText, ACHIEVEMENTS } from '../src/systems/missions';

describe('일일 미션·업적', () => {
  it('하루 3개, 같은 날은 항상 같음, 중복 없음', () => {
    const a = dailyMissions(20000).map((m) => m.key);
    expect(a).toHaveLength(3);
    expect(new Set(a).size).toBe(3);
    expect(dailyMissions(20000).map((m) => m.key)).toEqual(a);
  });
  it('날짜가 바뀌면 구성이 달라질 수 있음', () => {
    const days = new Set(Array.from({ length: 7 }, (_, i) => dailyMissions(20000 + i).map((m) => m.key).join()));
    expect(days.size).toBeGreaterThan(1);
  });
  it('기록 누적', () => {
    expect(addStats({ kills: 5 }, { kills: 3, spawns: 2 })).toEqual({ kills: 8, spawns: 2 });
  });
  it('문구에 목표 수 표시', () => {
    expect(missionText(ACHIEVEMENTS[0])).toBe('적 100마리 처치');
  });
});
