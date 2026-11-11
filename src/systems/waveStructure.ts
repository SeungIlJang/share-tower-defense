/**
 * 🌊 웨이브 구조 — 관문 웨이브를 '웨이브 1/4 → 휴식 → 웨이브 2/4 …'로 정리. 순수 로직(Vitest 검증).
 * - 웨이브는 하나씩 차례로. 웨이브 안에서는 SPAWN_GAP초마다 한 마리씩, 근접 → 원거리 → 큰 적 → 보스 순서
 * - 웨이브 사이 WAVE_REST초 휴식(적 성 생산도 멈춤 — Battle)
 * - 2관문부터 웨이브마다 마지막 보통 크기 적 1마리는 ⭐ 엘리트(무작위 대신 고정 · 큰 적·보스는 제외)
 * - 특수 이벤트는 마지막 웨이브 시작에 관문마다 정해진 것 하나
 */
import type { StageData, WaveEnemy } from '../types';
import { isBoss } from './bosses';

export const SPAWN_GAP = 1.3; // 웨이브 안 한 마리 간격(초)
export const WAVE_REST = 7; // 웨이브 사이 휴식(초)
export const FIRST_AT = 2; // 첫 웨이브 시작(초)
export const ELITE_FROM = 2; // 이 관문부터 웨이브 마지막 적이 엘리트
export const BIG_HP = 300; // 체력 이 이상이면 '큰 적'(뒤에 나옴)
const RANGED = 100;

type Stat = { hp: number; range: number };

/** 나오는 순서 — 0 근접 · 1 원거리 · 2 큰 적 · 3 보스 */
export function spawnRank(type: string, stats: Record<string, Stat>): number {
  if (isBoss(type)) return 3;
  const s = stats[type];
  if (!s) return 0;
  if (s.hp >= BIG_HP) return 2;
  return s.range >= RANGED ? 1 : 0;
}

/** 관문 웨이브를 차례 진행 구조로 바꿈(마릿수는 그대로) */
export function structureStage(stage: StageData, stats: Record<string, Stat>): StageData {
  const src = [...stage.waves].sort((a, b) => a.at - b.at);
  let t = FIRST_AT;
  const waves = src.map((w) => {
    const groups = w.enemies
      .filter((g) => g.count > 0)
      .map((g, i) => ({ g, i }))
      .sort((a, b) => spawnRank(a.g.type, stats) - spawnRank(b.g.type, stats) || a.i - b.i)
      .map(({ g }) => ({ type: g.type, count: g.count, interval: SPAWN_GAP }) as WaveEnemy);
    // ⭐ 마지막 보통 크기 적 1마리 → 엘리트(그 묶음에서 떼어 냄) — 큰 적·보스는 엘리트로 만들지 않음(너무 셈), 보통 적이 없을 때만 큰 적
    if (stage.id >= ELITE_FROM) {
      const ranks = groups.map((g) => spawnRank(g.type, stats));
      let li = ranks.map((r) => r < 2).lastIndexOf(true);
      if (li < 0) li = ranks.map((r) => r < 3).lastIndexOf(true);
      if (li >= 0) {
        const g = groups[li];
        const elite: WaveEnemy = { type: g.type, count: 1, interval: SPAWN_GAP, elite: true };
        if (g.count > 1) {
          groups.splice(li + 1, 0, elite);
          g.count -= 1;
        } else groups[li] = elite;
      }
    }
    let n = 0;
    for (const g of groups) {
      g.delay = n * SPAWN_GAP;
      n += g.count;
    }
    const at = t;
    t = at + Math.max(0, n - 1) * SPAWN_GAP + WAVE_REST;
    return { at, enemies: groups };
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
