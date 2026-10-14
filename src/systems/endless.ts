import type { StageData, Wave } from '../types';

/**
 * ♾️ 무한 모드 — 20초마다 웨이브, 웨이브마다 적이 늘고 강해짐. 5·10번째마다 보스.
 * 우리 기지가 무너질 때까지 버틴 웨이브 수가 기록. (순수 로직, Vitest 검증)
 */
export const WAVE_SEC = 20;
export const ENDLESS_ID = 0;
const MAX_WAVES = 90; // 30분 분량 미리 생성

const EARLY = ['goblin', 'slime', 'wolf', 'bat'];
const MID = ['orc', 'skeleton', 'mushroom', 'ghost'];

export function endlessWaveAt(clockSec: number): number {
  return Math.max(1, Math.floor((clockSec - 1) / WAVE_SEC) + 1);
}

/** 웨이브 n의 적 체력·공격 배율 */
export function endlessMult(wave: number): number {
  return 1 + 0.12 * (wave - 1);
}

export function endlessWaves(): Wave[] {
  const waves: Wave[] = [];
  for (let n = 1; n <= MAX_WAVES; n++) {
    const pool = n <= 3 ? EARLY : n <= 8 ? [...EARLY, ...MID] : MID;
    const count = 3 + Math.floor(n * 0.7);
    const a = pool[n % pool.length];
    const b = pool[(n * 3 + 1) % pool.length];
    const enemies = [
      { type: a, count: Math.ceil(count / 2), interval: 1.1 },
      { type: b, count: Math.floor(count / 2), interval: 0.9 },
    ];
    if (n % 10 === 5) enemies.push({ type: 'ogre', count: 1, interval: 1 });
    if (n % 10 === 0) enemies.push({ type: 'dragon', count: 1, interval: 1 });
    waves.push({ at: 1 + (n - 1) * WAVE_SEC, enemies });
  }
  return waves;
}

export function endlessStage(): StageData {
  return { id: ENDLESS_ID, name: '무한 모드', baseHp: 220, startGold: 160, goldRate: 15, waves: endlessWaves() };
}

/** 기록 보상 골드 */
export function endlessReward(wave: number): number {
  return wave * 20;
}

export interface EndlessRecord {
  wave: number;
  date: number; // ms
}

/** 명예의 전당(상위 5개) 갱신 → [새 목록, 신기록인가] */
export function pushRecord(list: EndlessRecord[], wave: number, date: number): [EndlessRecord[], boolean] {
  const best = list[0]?.wave ?? 0;
  const next = [...list, { wave, date }].sort((x, y) => y.wave - x.wave || x.date - y.date).slice(0, 5);
  return [next, wave > best];
}
