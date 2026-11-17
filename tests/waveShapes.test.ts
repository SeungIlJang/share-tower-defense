import { describe, expect, it } from 'vitest';
import enemies from '../src/data/enemies.json';
import { battleStage } from '../src/systems/waveStructure';
import { AMBUSH_FROM, AMBUSH_MAX, SHAPE_FROM, SHAPE_INFO, arrange, pickShape, shapeChoices, type Slot, type Trait, type WaveShape } from '../src/systems/waveShapes';
import { STAGES } from '../src/systems/worlds';
import type { StageData } from '../src/types';

const E = enemies as Record<string, { hp: number; range: number; speed: number }>;
const PACE = { gap: 0.4, squad: 3, squadGap: 1.4 };

// 시험용 적 — 이름으로 특징을 정함
const T: Record<string, Trait> = {
  wolf: { rank: 0, speed: 95, flying: false, armored: false },
  goblin: { rank: 0, speed: 54, flying: false, armored: false },
  orc: { rank: 0, speed: 40, flying: false, armored: true },
  archer: { rank: 1, speed: 48, flying: false, armored: false },
  bat: { rank: 0, speed: 112, flying: true, armored: false },
  ogre: { rank: 2, speed: 26, flying: false, armored: false },
  boss: { rank: 3, speed: 22, flying: false, armored: false },
};
const traitOf = (t: string): Trait => T[t];
const slots = (spec: Record<string, number>): Slot[] => Object.entries(spec).flatMap(([type, n]) => Array.from({ length: n }, () => ({ type })));
const times = (shape: WaveShape, s: Slot[], type: string): number[] => arrange(shape, s, traitOf, PACE).filter((x) => x.type === type).map((x) => x.t);
const count = (s: StageData): number => s.waves.reduce((a, w) => a + w.enemies.reduce((b, g) => b + g.count, 0), 0);

describe('🌊 웨이브 모양', () => {
  it('어떤 모양이든 마릿수는 그대로', () => {
    const s = slots({ wolf: 5, goblin: 6, orc: 3, archer: 2, bat: 4, ogre: 1, boss: 1 });
    for (const shape of ['squad', ...Object.keys(SHAPE_INFO)] as WaveShape[]) {
      const out = arrange(shape, s, traitOf, PACE);
      expect(out.length).toBe(s.length);
      expect(out.map((x) => x.type).sort()).toEqual(s.map((x) => x.type).sort());
      expect(out.every((x, i) => i === 0 || x.t >= out[i - 1].t)).toBe(true);
      expect(out[0].t).toBe(0);
    }
  });

  it('🐺 돌진 떼 — 빠른 적이 다닥다닥 먼저, 나머지는 한참 뒤', () => {
    const s = slots({ goblin: 4, wolf: 5 });
    const w = times('rush', s, 'wolf');
    expect(w[w.length - 1] - w[0]).toBeLessThan(1);
    expect(Math.min(...times('rush', s, 'goblin'))).toBeGreaterThan(w[w.length - 1] + 1.5);
  });

  it('🛡️ 방패 벽 — 단단한 적이 앞, 원거리가 바로 뒤', () => {
    const s = slots({ goblin: 3, orc: 4, archer: 2 });
    const orc = times('wall', s, 'orc');
    const arc = times('wall', s, 'archer');
    expect(orc[0]).toBe(0);
    expect(arc[0]).toBeGreaterThan(orc[orc.length - 1]);
    expect(arc[0] - orc[orc.length - 1]).toBeLessThan(1);
    expect(Math.min(...times('wall', s, 'goblin'))).toBeGreaterThan(arc[arc.length - 1]);
  });

  it('🦇 하늘 습격 — 땅의 적이 먼저, 비행 떼는 뒤에서 한꺼번에', () => {
    const s = slots({ goblin: 6, bat: 6 });
    const bat = times('air', s, 'bat');
    expect(bat[0]).toBeGreaterThan(Math.max(...times('air', s, 'goblin')));
    expect(bat[bat.length - 1] - bat[0]).toBeLessThan(1);
  });

  it('👹 거대 적 — 호위 절반이 앞, 절반이 바로 뒤(가운데에 큰 적)', () => {
    const s = slots({ goblin: 6, ogre: 1 });
    const og = times('giant', s, 'ogre')[0];
    const gob = times('giant', s, 'goblin');
    expect(gob.filter((t) => t < og).length).toBe(3);
    expect(gob.filter((t) => t > og).length).toBe(3);
    expect(gob[gob.length - 1] - og).toBeLessThan(1.5);
  });

  it('⚠️ 기습 — 작은 근접 적의 1/3(최대 4)만, 엘리트는 빼고 웨이브 중간에', () => {
    const s: Slot[] = [...slots({ goblin: 14, archer: 2 }), { type: 'goblin', elite: true }];
    const out = arrange('ambush', s, traitOf, PACE);
    const amb = out.filter((x) => x.ambush);
    expect(amb.length).toBe(AMBUSH_MAX);
    expect(amb.every((x) => x.type === 'goblin' && !x.elite)).toBe(true);
    expect(amb[0].t).toBeGreaterThan(0);
    expect(amb[0].t).toBeLessThan(out[out.length - 1].t);
    expect(arrange('ambush', slots({ goblin: 6 }), traitOf, PACE).filter((x) => x.ambush).length).toBe(2);
  });

  it('🔥 총공격 — 쉴 틈 없이, 보스는 맨 뒤', () => {
    const s = slots({ goblin: 10, ogre: 1, boss: 1 });
    const out = arrange('allout', s, traitOf, PACE);
    expect(out[out.length - 1].type).toBe('boss');
    expect(out[10].t).toBeLessThan(arrange('squad', s, traitOf, PACE)[10].t / 2);
  });

  it('모양 고르기 — 3관문까지는 없음, 마지막 웨이브는 총공격, 구성에 맞는 것만', () => {
    const s = slots({ wolf: 6, goblin: 2 });
    expect(pickShape(SHAPE_FROM - 1, 0, 4, s, traitOf)).toBe('squad');
    expect(pickShape(SHAPE_FROM, 3, 4, s, traitOf)).toBe('allout');
    expect(pickShape(SHAPE_FROM, 0, 4, s, traitOf)).toBe('rush');
    expect(pickShape(SHAPE_FROM, 0, 4, slots({ goblin: 3 }), traitOf)).toBe('squad');
    expect(shapeChoices(AMBUSH_FROM, slots({ goblin: 8 }), traitOf)).toContain('ambush');
    expect(shapeChoices(AMBUSH_FROM - 1, slots({ goblin: 8 }), traitOf)).not.toContain('ambush');
    expect(shapeChoices(AMBUSH_FROM, slots({ goblin: 8 }), traitOf, true)).not.toContain('ambush'); // 특수 관문은 기습 없음
    expect(pickShape(AMBUSH_FROM, 1, 4, slots({ goblin: 8 }), traitOf, false, ['ambush'])).toBe('squad'); // 기습은 한 관문에 한 번
    expect(pickShape(SHAPE_FROM, 0, 4, slots({ wolf: 6, orc: 4 }), traitOf, false, ['rush'])).toBe('wall'); // 안 쓴 모양 먼저
  });

  it('실제 관문 — 4~40관문에 여섯 모양이 모두 나오고, 한 관문에 두 가지 이상', () => {
    const seen = new Set<string>();
    for (const st of STAGES.filter((s) => s.id >= SHAPE_FROM && s.id <= 40)) {
      const b = battleStage(st, E);
      const shapes = b.waves.map((w) => w.shape ?? 'squad');
      shapes.forEach((x) => seen.add(x));
      expect(new Set(shapes).size).toBeGreaterThanOrEqual(2);
      expect(shapes[shapes.length - 1]).toBe('allout');
      expect(shapes.filter((x) => x === 'ambush').length).toBeLessThanOrEqual(1);
    }
    for (const k of Object.keys(SHAPE_INFO)) expect(seen.has(k)).toBe(true);
    // 첫 3관문은 모양 없음 · 마릿수는 모양과 무관
    for (const st of STAGES.slice(0, 3)) expect(battleStage(st, E).waves.every((w) => !w.shape)).toBe(true);
    const st = STAGES.find((s) => s.id === 12)!;
    expect(count(battleStage(st, E))).toBe(count(battleStage(st, E, true)));
  });
});
