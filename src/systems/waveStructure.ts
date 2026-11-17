/**
 * 🌊 웨이브 구조 — 관문 웨이브를 '웨이브 1/4 → 휴식 → 웨이브 2/4 …'로 정리. 순수 로직(Vitest 검증).
 * - 웨이브는 하나씩 차례로. 웨이브 안에서는 SQUAD마리씩 뭉쳐서(안에서는 SPAWN_GAP초 간격, 무리 사이 SQUAD_GAP초), 근접 → 원거리 → 큰 적 → 보스 순서
 *   (한 마리씩 1.3초마다 나오던 '메트로놈'을 없앰 — 몰려오는 순간과 숨 돌리는 순간이 번갈아 옴)
 * - 웨이브 사이 WAVE_REST초 휴식(적 성 생산도 멈춤 — Battle)
 * - 2관문부터 웨이브마다 마지막 보통 크기 적 1마리는 ⭐ 엘리트(무작위 대신 고정 · 큰 적·보스는 제외)
 * - 특수 이벤트는 마지막 웨이브 시작에 관문마다 정해진 것 하나
 */
import type { StageData, WaveEnemy } from '../types';
import { isBoss } from './bosses';
import { enemyKind } from './counters';
import { earlyTune, thinStage } from './density';
import { arrange, pickShape, type Slot, type Trait, type WaveShape } from './waveShapes';

export const SPAWN_GAP = 0.4; // 무리 안 한 마리 간격(초)
export const SQUAD = 3; // 한 무리 마릿수
export const SQUAD_GAP = 1.4; // 무리와 무리 사이(초)
export const WAVE_REST = 4.5; // 웨이브 사이 휴식(초)
export const FIRST_AT = 2; // 첫 웨이브 시작(초)
export const ELITE_FROM = 2; // 이 관문부터 웨이브 마지막 적이 엘리트
export const BIG_HP = 300; // 체력 이 이상이면 '큰 적'(뒤에 나옴)
const RANGED = 100;

type Stat = { hp: number; range: number; speed?: number };

/** 나오는 순서 — 0 근접 · 1 원거리 · 2 큰 적 · 3 보스 */
export function spawnRank(type: string, stats: Record<string, Stat>): number {
  if (isBoss(type)) return 3;
  const s = stats[type];
  if (!s) return 0;
  if (s.hp >= BIG_HP) return 2;
  return s.range >= RANGED ? 1 : 0;
}

export interface Pace {
  gap: number; // 무리 안 간격
  rest: number; // 웨이브 사이 휴식
  squad: number; // 한 무리 마릿수(0 = 무리 없이 gap마다 한 마리)
  squadGap: number; // 무리 사이
}
export const PACE: Pace = { gap: SPAWN_GAP, rest: WAVE_REST, squad: SQUAD, squadGap: SQUAD_GAP };

/** 웨이브 안 k번째(0부터) 적이 나오는 시각 */
export function spawnAt(k: number, p: Pace = PACE): number {
  if (p.squad <= 1) return k * p.gap;
  return Math.floor(k / p.squad) * ((p.squad - 1) * p.gap + p.squadGap) + (k % p.squad) * p.gap;
}

/** ⚔️ 전투·출전 준비가 함께 쓰는 관문 구성 — 첫 3관문은 줄이지 않고 빨리, 그 뒤는 줄이고 무리 지어 */
export function battleStage(stage: StageData, stats: Record<string, Stat>, special = false): StageData {
  const early = earlyTune(stage.id, special);
  return early ? structureStage(stage, stats, { gap: early.gap, rest: early.rest, squad: 0, squadGap: 0 }) : structureStage(thinStage(stage), stats, PACE, special);
}

/** 관문 웨이브를 차례 진행 구조로 바꿈(마릿수는 그대로) */
export function structureStage(stage: StageData, stats: Record<string, Stat>, pace: Pace = PACE, special = false): StageData {
  const { gap, rest } = pace;
  const src = [...stage.waves].sort((a, b) => a.at - b.at);
  const traitOf = (type: string): Trait => {
    const k = enemyKind(type);
    return { rank: spawnRank(type, stats), speed: stats[type]?.speed ?? 0, flying: k === 'flying', armored: k === 'armored' };
  };
  let t = FIRST_AT;
  const used: WaveShape[] = []; // 이 관문에서 이미 쓴 모양
  const waves = src.map((w, wi) => {
    const groups = w.enemies
      .filter((g) => g.count > 0)
      .map((g, i) => ({ g, i }))
      .sort((a, b) => spawnRank(a.g.type, stats) - spawnRank(b.g.type, stats) || a.i - b.i)
      .map(({ g }) => ({ ...g, delay: undefined, interval: gap }) as WaveEnemy);
    // ⭐ 마지막 보통 크기 적 1마리 → 엘리트(그 묶음에서 떼어 냄) — 큰 적·보스는 엘리트로 만들지 않음(너무 셈), 보통 적이 없을 때만 큰 적
    if (stage.id >= ELITE_FROM) {
      const ranks = groups.map((g) => spawnRank(g.type, stats));
      let li = ranks.map((r) => r < 2).lastIndexOf(true);
      if (li < 0) li = ranks.map((r) => r < 3).lastIndexOf(true);
      if (li >= 0) {
        const g = groups[li];
        const elite: WaveEnemy = { ...g, count: 1, interval: gap, elite: true };
        if (g.count > 1) {
          groups.splice(li + 1, 0, elite);
          g.count -= 1;
        } else groups[li] = elite;
      }
    }
    // 🌊 웨이브 모양 — 무리 짓는 관문 중 SHAPE_FROM부터. 모양이 있으면 한 마리씩 시각을 매김
    const slots: Slot[] = groups.flatMap((g) => Array.from({ length: g.count }, () => ({ type: g.type, elite: g.elite, budget: g.budget })));
    const shape = pace.squad > 1 ? pickShape(stage.id, wi, src.length, slots, traitOf, special, used) : 'squad';
    used.push(shape);
    if (shape !== 'squad') {
      const timed = arrange(shape, slots, traitOf, pace);
      const at = t;
      t = at + (timed.length ? timed[timed.length - 1].t : 0) + rest;
      return { at, shape, enemies: timed.map((s) => ({ type: s.type, count: 1, interval: gap, delay: s.t, elite: s.elite, budget: s.budget, ambush: s.ambush }) as WaveEnemy) };
    }
    // 무리 경계에서 묶음을 나눠 시각을 매김(묶음 안은 gap 간격)
    const out: WaveEnemy[] = [];
    let n = 0;
    for (const g of groups) {
      let left = g.count;
      while (left > 0) {
        const c = pace.squad > 1 ? Math.min(left, pace.squad - (n % pace.squad)) : left;
        out.push({ ...g, count: c, delay: spawnAt(n, pace) });
        n += c;
        left -= c;
      }
    }
    const at = t;
    t = at + spawnAt(Math.max(0, n - 1), pace) + rest;
    return { at, enemies: out };
  });
  return { ...stage, waves };
}

export interface WaveInfo {
  index: number; // 지금(또는 다음) 웨이브 번호(1부터)
  total: number;
  phase: 'wave' | 'rest' | 'done'; // 나오는 중 · 다음 웨이브 기다리는 중 · 다 나옴
  nextIn: number; // 휴식 중이면 다음 웨이브까지 남은 초
}

/** 지금이 몇 번째 웨이브인지 — 시작~마지막 적 나오는 시각까지 'wave', 그 사이는 'rest' */
export function waveInfo(stage: StageData, now: number): WaveInfo {
  const ws = [...stage.waves].sort((a, b) => a.at - b.at);
  const total = ws.length;
  for (let i = 0; i < total; i++) {
    const w = ws[i];
    const end = w.at + Math.max(0, ...w.enemies.map((g) => (g.delay ?? 0) + (g.count - 1) * g.interval));
    if (now < w.at) return { index: i + 1, total, phase: 'rest', nextIn: w.at - now };
    if (now <= end) return { index: i + 1, total, phase: 'wave', nextIn: 0 };
  }
  return { index: total, total, phase: 'done', nextIn: 0 };
}
