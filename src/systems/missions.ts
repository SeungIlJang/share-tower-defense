/**
 * 📋 일일 미션·업적 — 순수 로직(Vitest 검증).
 * 전투 기록(StatKey)을 판이 끝날 때 한 번에 누적 → 일일(오늘) / 업적(전체) 진행도 계산.
 */
export type StatKey = 'kills' | 'spawns' | 'perfects' | 'weapons' | 'clears' | 'bosses' | 'elites' | 'stars' | 'skills' | 'timeGoals' | 'bigRuns' | 'levelRuns' | 'specials';

export type Stats = Partial<Record<StatKey, number>>;

export interface Mission {
  key: string;
  stat: StatKey;
  goal: number;
  reward: number;
  text: string; // {n} = 목표
}

/** 일일 미션 후보 — 날짜마다 3개 선택 */
export const DAILY_POOL: Mission[] = [
  { key: 'd_kills', stat: 'kills', goal: 60, reward: 80, text: '적 {n}마리 처치' },
  { key: 'd_spawns', stat: 'spawns', goal: 30, reward: 60, text: '유닛 {n}번 소환' },
  { key: 'd_perfects', stat: 'perfects', goal: 10, reward: 80, text: 'PERFECT 소환 {n}번' },
  { key: 'd_weapons', stat: 'weapons', goal: 6, reward: 70, text: '특수 무기 {n}번 사용' },
  { key: 'd_clears', stat: 'clears', goal: 3, reward: 100, text: '스테이지 {n}번 클리어' },
  { key: 'd_elites', stat: 'elites', goal: 3, reward: 90, text: '엘리트 적 {n}마리 처치' },
  { key: 'd_skills', stat: 'skills', goal: 15, reward: 70, text: '유닛 스킬 {n}번 발동' },
];

/** 업적 — 누적 기록, 한 번만 받음 */
export const ACHIEVEMENTS: Mission[] = [
  { key: 'a_kills1', stat: 'kills', goal: 100, reward: 100, text: '적 {n}마리 처치' },
  { key: 'a_kills2', stat: 'kills', goal: 1000, reward: 400, text: '적 {n}마리 처치' },
  { key: 'a_spawns', stat: 'spawns', goal: 300, reward: 200, text: '유닛 {n}번 소환' },
  { key: 'a_perfects', stat: 'perfects', goal: 100, reward: 300, text: 'PERFECT 소환 {n}번' },
  { key: 'a_bosses', stat: 'bosses', goal: 5, reward: 300, text: '보스 {n}마리 처치' },
  { key: 'a_elites', stat: 'elites', goal: 30, reward: 250, text: '엘리트 적 {n}마리 처치' },
  { key: 'a_stars', stat: 'stars', goal: 30, reward: 500, text: '별 {n}개 모으기' },
  { key: 'a_clears', stat: 'clears', goal: 20, reward: 200, text: '스테이지 {n}번 클리어' },
  // 🐶 팔라독식 도전 업적(한 판 기록 · 목표 시간 · 특수 관문)
  { key: 'a_timegoal', stat: 'timeGoals', goal: 10, reward: 400, text: '⏱️ 목표 시간 안에 {n}번 클리어' },
  { key: 'a_bigrun', stat: 'bigRuns', goal: 1, reward: 300, text: '한 판에 적 100마리 처치' },
  { key: 'a_levelrun', stat: 'levelRuns', goal: 1, reward: 300, text: '한 판에 레벨업 8번' },
  { key: 'a_special', stat: 'specials', goal: 10, reward: 500, text: '🎯 특수 관문 {n}번 클리어' },
  { key: 'a_bosses2', stat: 'bosses', goal: 30, reward: 800, text: '보스 {n}마리 처치' },
  { key: 'a_kills3', stat: 'kills', goal: 10000, reward: 1500, text: '적 {n}마리 처치' },
  { key: 'a_clears2', stat: 'clears', goal: 100, reward: 1000, text: '스테이지 {n}번 클리어' },
  { key: 'a_stars2', stat: 'stars', goal: 150, reward: 1500, text: '별 {n}개 모으기' },
  { key: 'a_stars3', stat: 'stars', goal: 300, reward: 4000, text: '별 {n}개 모으기' },
];

export function missionText(m: Mission): string {
  return m.text.replace('{n}', String(m.goal));
}

/** 날짜 index로 오늘의 미션 3개(같은 날엔 항상 같음) */
export function dailyMissions(day: number): Mission[] {
  const pool = [...DAILY_POOL];
  const out: Mission[] = [];
  let seed = (day * 9301 + 49297) % 233280;
  while (out.length < 3 && pool.length) {
    seed = (seed * 9301 + 49297) % 233280;
    out.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return out;
}

export function addStats(base: Stats, add: Stats): Stats {
  const out: Stats = { ...base };
  for (const [k, v] of Object.entries(add) as [StatKey, number][]) out[k] = (out[k] ?? 0) + v;
  return out;
}
