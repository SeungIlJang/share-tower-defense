import { describe, it, expect } from 'vitest';
import { endlessWaveAt, endlessMult, endlessWaves, pushRecord, endlessReward } from '../src/systems/endless';
import enemiesData from '../src/data/enemies.json';

describe('무한 모드', () => {
  it('20초마다 웨이브', () => {
    expect(endlessWaveAt(0)).toBe(1);
    expect(endlessWaveAt(20.5)).toBe(1);
    expect(endlessWaveAt(21.5)).toBe(2);
  });
  it('웨이브마다 강해짐', () => {
    expect(endlessMult(1)).toBe(1);
    expect(endlessMult(11)).toBeCloseTo(2.2);
  });
  it('5·10번째 웨이브에 보스, 모든 적은 실제 데이터', () => {
    const w = endlessWaves();
    expect(w[4].enemies.some((e) => e.type === 'ogre')).toBe(true);
    expect(w[9].enemies.some((e) => e.type === 'dragon')).toBe(true);
    for (const wave of w) for (const e of wave.enemies) expect(enemiesData, e.type).toHaveProperty(e.type);
  });
  it('명예의 전당: 상위 5개, 신기록 판정', () => {
    let list: { wave: number; date: number }[] = [];
    let isBest = false;
    for (const [w, d] of [[5, 1], [8, 2], [3, 3], [8, 4], [12, 5], [1, 6]]) [list, isBest] = pushRecord(list, w, d);
    expect(list.map((r) => r.wave)).toEqual([12, 8, 8, 5, 3]);
    expect(isBest).toBe(false); // 마지막 1웨이브는 신기록 아님
    expect(pushRecord(list, 13, 7)[1]).toBe(true);
  });
  it('보상 = 웨이브 × 20', () => {
    expect(endlessReward(7)).toBe(140);
  });
});
