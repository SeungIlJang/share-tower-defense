import { describe, it, expect } from 'vitest';
import enemies from '../src/data/enemies.json';
import { FIRST_AT, SPAWN_GAP, WAVE_REST, spawnRank, structureStage, waveInfo } from '../src/systems/waveStructure';
import { WaveSystem } from '../src/systems/waves';
import { eventsFor, stageEvent } from '../src/systems/stageEvents';
import { STAGES } from '../src/systems/worlds';
import type { StageData } from '../src/types';

const E = enemies as Record<string, { hp: number; range: number }>;
const count = (s: StageData): number => s.waves.reduce((a, w) => a + w.enemies.reduce((b, g) => b + g.count, 0), 0);

describe('🌊 웨이브 구조', () => {
  it('마릿수는 그대로, 웨이브는 차례로(겹치지 않고 휴식을 두고)', () => {
    for (const s of STAGES.slice(0, 40)) {
      const t = structureStage(s, E);
      expect(count(t)).toBe(count(s));
      expect(t.waves[0].at).toBe(FIRST_AT);
      for (let i = 1; i < t.waves.length; i++) {
        const prev = t.waves[i - 1];
        const n = prev.enemies.reduce((a, g) => a + g.count, 0);
        expect(t.waves[i].at).toBeCloseTo(prev.at + (n - 1) * SPAWN_GAP + WAVE_REST, 5);
      }
    }
  });

  it('웨이브 안 순서 — 근접 → 원거리 → 큰 적 → 보스, 한 마리씩 일정한 간격', () => {
    const s = structureStage(STAGES.find((x) => x.id === 10)!, E);
    for (const w of s.waves) {
      const times: { t: number; r: number }[] = [];
      for (const g of w.enemies) for (let i = 0; i < g.count; i++) times.push({ t: (g.delay ?? 0) + i * g.interval, r: g.elite ? -1 : spawnRank(g.type, E) });
      times.sort((a, b) => a.t - b.t);
      for (let i = 1; i < times.length; i++) expect(times[i].t - times[i - 1].t).toBeCloseTo(SPAWN_GAP, 5);
      const ranks = times.map((x) => x.r).filter((r) => r >= 0);
      expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
    }
  });

  it('⭐ 2관문부터 웨이브마다 마지막 보통 크기 적 1마리가 엘리트(큰 적·보스 제외)', () => {
    expect(structureStage(STAGES[0], E).waves.some((w) => w.enemies.some((g) => g.elite))).toBe(false);
    for (const w of structureStage(STAGES.find((x) => x.id === 5)!, E).waves) {
      const elites = w.enemies.filter((g) => g.elite);
      expect(elites.length).toBe(1);
      expect(elites[0].count).toBe(1);
      const after = w.enemies.slice(w.enemies.indexOf(elites[0]) + 1);
      expect(after.every((g) => spawnRank(g.type, E) >= 2)).toBe(true); // 뒤에는 큰 적·보스만
      if (w.enemies.some((g) => spawnRank(g.type, E) < 2)) expect(spawnRank(elites[0].type, E)).toBeLessThan(2);
    }
  });

  it('지금 몇 번째 웨이브 · 휴식 · 끝', () => {
    const s = structureStage(STAGES.find((x) => x.id === 5)!, E);
    expect(waveInfo(s, 0)).toMatchObject({ index: 1, phase: 'rest' });
    expect(waveInfo(s, FIRST_AT + 0.1)).toMatchObject({ index: 1, phase: 'wave', total: s.waves.length });
    expect(waveInfo(s, s.waves[1].at - 1)).toMatchObject({ index: 2, phase: 'rest' });
    expect(waveInfo(s, 9999).phase).toBe('done');
    // 소환기에 넣어도 엘리트 표시가 살아 있음
    const w = new WaveSystem(s);
    const evs = w.update(9999);
    expect(evs.length).toBe(count(s));
    expect(evs.filter((e) => e.elite).length).toBe(s.waves.length);
  });

  it('⚠️ 관문 특수 이벤트는 정해져 있고(1관문 없음) 그 단계에서 열린 것만', () => {
    expect(stageEvent(1)).toBeNull();
    for (let id = 2; id <= 100; id++) {
      const e = stageEvent(id)!;
      expect(eventsFor(id).map((x) => x.key)).toContain(e.key);
      expect(stageEvent(id)).toEqual(e);
    }
  });
});
