import { describe, it, expect } from 'vitest';
import enemies from '../src/data/enemies.json';
import { FEATURED, RARE_MAX, ROSTER_MAX, castRoster, eliteRoster, featuredOf, introAt, newEnemyAt, prodRoster, rosterCap, stageRoster } from '../src/systems/roster';
import { EVENT_TYPES, stageEvent } from '../src/systems/stageEvents';
import { isBoss } from '../src/systems/bosses';
import base from '../src/data/stages.json';
import { STAGES, buildStages } from '../src/systems/worlds';
import type { StageData } from '../src/types';

const E = enemies as unknown as Record<string, { hp: number }>;
const typesOf = (s: StageData): string[] => [...new Set(s.waves.flatMap((w) => w.enemies.map((g) => g.type)))].filter((t) => !isBoss(t));

describe('🪜 관문별 적 명단', () => {
  it('1관문은 고블린 1종, 한 관문에 하나씩 늘어 6관문부터 5종', () => {
    expect(stageRoster(1)).toEqual(['goblin']);
    expect(stageRoster(2)).toEqual(['slime', 'goblin']);
    expect(stageRoster(3)).toEqual(['wolf', 'slime', 'goblin']);
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rosterCap)).toEqual([1, 2, 3, 4, 4, 5, 5, 5, 5, 5]);
    for (let id = 6; id <= 100; id++) expect(stageRoster(id).length).toBe(ROSTER_MAX);
  });

  it('주인공 적은 명단 맨 앞이고, 명단의 적은 모두 실제로 있는 보통 적', () => {
    for (let id = 1; id <= 100; id++) {
      const r = stageRoster(id);
      expect(r[0]).toBe(featuredOf(id));
      expect(new Set(r).size).toBe(r.length);
      for (const t of r) {
        expect(E[t]).toBeTruthy();
        expect(isBoss(t)).toBe(false);
      }
    }
  });

  it('새 적은 한 관문에 1종씩만 — 월드 1은 1~8관문, 그 뒤 월드는 1·3·5·7번째 관문', () => {
    const news: Record<number, string> = {};
    for (let id = 1; id <= 100; id++) {
      const t = newEnemyAt(id);
      if (t) news[id] = t;
    }
    for (const id of Object.keys(news).map(Number)) {
      const slot = (id - 1) % 10;
      if (id <= 10) expect(slot).toBeLessThan(8);
      else expect([0, 2, 4, 6]).toContain(slot);
    }
    // 보스가 아닌 적 29종이 모두 한 번씩 소개됨
    const all = Object.keys(E).filter((t) => !isBoss(t));
    expect(Object.values(news).sort()).toEqual(all.sort());
  });

  it('이웃한 관문은 명단이 1종만 다름(천천히 바뀜)', () => {
    for (let id = 7; id <= 100; id++) {
      const a = stageRoster(id - 1);
      const b = stageRoster(id);
      expect(b.filter((t) => !a.includes(t)).length).toBeLessThanOrEqual(1);
    }
  });

  it('월드마다 주인공 적 10개', () => {
    for (let w = 1; w <= 10; w++) expect(FEATURED[w].length).toBe(10);
  });

  it('실제 관문 100개 — 명단 밖의 적이 없고, 주인공 적이 꼭 나오고 비중이 큼', () => {
    for (const s of STAGES) {
      const r = stageRoster(s.id);
      const ts = typesOf(s);
      for (const t of ts) expect(r).toContain(t);
      expect(ts).toContain(r[0]);
      const mass: Record<string, number> = {};
      for (const w of s.waves) for (const g of w.enemies) if (!isBoss(g.type)) mass[g.type] = (mass[g.type] ?? 0) + g.count * E[g.type].hp;
      if (RARE_MAX[r[0]] === undefined) expect(Object.values(mass).filter((m) => m > mass[r[0]]).length).toBeLessThanOrEqual(3); // 체력 몫으로 4위 안(무거운 적 옆의 가벼운 주인공 적)
      for (const w of s.waves) for (const g of w.enemies) expect(g.budget).toBeUndefined(); // 적은 늘 제 능력치
      for (const [t, cap] of Object.entries(RARE_MAX)) expect(s.waves.reduce((n, w) => n + w.enemies.reduce((m, g) => m + (g.type === t ? g.count : 0), 0), 0)).toBeLessThanOrEqual(cap); // 🧙 소환·분열 적은 몇 마리만
    }
  });

  it('실제 관문 100개 — 바꾸기 전과 체력 총합이 ±20% 안, 마릿수는 1.35배 안', () => {
    const before = buildStages(base as StageData[], false);
    const sumOf = (s: StageData): [number, number] => {
      let n = 0;
      let h = 0;
      for (const w of s.waves) for (const g of w.enemies) if (!isBoss(g.type)) {
        n += g.count;
        h += g.count * E[g.type].hp;
      }
      return [n, h];
    };
    for (const s of STAGES) {
      const [n0, h0] = sumOf(before[s.id - 1]);
      const [n1, h1] = sumOf(s);
      expect(h1 / h0).toBeGreaterThan(0.8);
      expect(h1 / h0).toBeLessThan(1.2);
      expect(n1).toBeLessThanOrEqual(Math.ceil(n0 * 1.35) + 2);
    }
  });

  it('바꿔도 체력 총합은 거의 같고 보스는 그대로', () => {
    const s: StageData = {
      id: 1,
      name: 't',
      world: 1,
      baseHp: 100,
      startGold: 100,
      goldRate: 10,
      waves: [{ at: 1, enemies: [{ type: 'orc', count: 4, interval: 1 }, { type: 'bat', count: 6, interval: 1 }, { type: 'ogre', count: 1, interval: 1 }] }],
    };
    const out = castRoster(s).waves[0].enemies;
    expect(out.find((g) => g.type === 'ogre')?.count).toBe(1);
    const gob = out.find((g) => g.type === 'goblin')!;
    expect(out.length).toBe(2);
    const want = 4 * 220 + 6 * 42;
    expect(Math.abs(gob.count * 90 - want) / want).toBeLessThan(0.15);
  });

  it('특수 이벤트는 그 관문까지 소개된 적만(엘리트 부대는 명단에서)', () => {
    expect(stageEvent(2)?.key).toBe('elites');
    for (let id = 2; id <= 100; id++) {
      const e = stageEvent(id)!;
      for (const t of EVENT_TYPES[e.key]) expect(introAt(t)).toBeLessThanOrEqual(id);
      const el = eliteRoster(id);
      expect(el.length).toBe(3);
      for (const t of el) expect(stageRoster(id)).toContain(t);
    }
  });

  it('적 성은 명단의 가벼운 적만 뽑음', () => {
    expect(prodRoster(1)).toEqual(['goblin']);
    for (let id = 1; id <= 100; id++) {
      const p = prodRoster(id);
      expect(p.length).toBeGreaterThan(0);
      for (const t of p) expect(stageRoster(id)).toContain(t);
    }
  });
});
