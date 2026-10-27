/**
 * 👑 주간 보스 — 일주일 동안 같은 보스에게 90초씩 도전, 준 피해를 쌓아 단계 보상. 순수 로직(Vitest 검증).
 * 보스는 죽지 않음(체력 무한) — 피해는 '그 관문 보스 체력의 몇 배'로 셈(진행도가 달라도 공평하게).
 */
import type { StageData } from '../types';
import { isBoss, worldBoss } from './bosses';

export const WEEKLY_SEC = 90; // 한 판 제한 시간
export const WEEKLY_UNLOCK = 10; // 10관문(첫 월드 보스)을 깨면 열림
export const WEEKLY_HP = 1e9; // 쓰러지지 않는 보스 체력

/** 단계 — 누적 피해(보스 체력 배수) · 보상 */
export const WEEKLY_STEPS: { need: number; gold: number; chest: 0 | 1 | 2 | 3 | null }[] = [
  { need: 0.5, gold: 150, chest: null },
  { need: 1, gold: 250, chest: 0 },
  { need: 2, gold: 400, chest: 1 },
  { need: 4, gold: 700, chest: 2 },
  { need: 7, gold: 1000, chest: 3 },
];

/** 날짜 index → 주 번호(월요일 시작; 1970-01-01은 목요일) */
export function weekIndex(day: number): number {
  return Math.floor((day + 3) / 7);
}

/** 이번 주 보스 — 월드 1~10 보스가 차례로 */
export function weeklyBoss(week: number): string {
  return worldBoss((((week % 10) + 10) % 10) + 1);
}

/** 도전 관문 — 깬 마지막 월드 보스 관문(적 세기가 내 진행도에 맞음) */
export function weeklyStageId(clearedMax: number): number {
  return Math.max(WEEKLY_UNLOCK, Math.floor(clearedMax / 10) * 10);
}

/** 관문 데이터 — 원래 보스는 빼고(주간 보스가 따로 나옴), 일반 적 웨이브만 */
export function weeklyStage(base: StageData): StageData {
  const waves = base.waves.map((w) => ({ ...w, enemies: w.enemies.filter((e) => !isBoss(e.type)) })).filter((w) => w.enemies.length);
  return { ...base, name: '👑 주간 보스', waves };
}

/** 지금까지 달성한 단계 수 */
export function weeklyStepOf(total: number): number {
  return WEEKLY_STEPS.filter((s) => total >= s.need).length;
}

/** 이번 판으로 새로 달성한 단계 index 목록 */
export function newSteps(before: number, after: number): number[] {
  const out: number[] = [];
  for (let i = weeklyStepOf(before); i < weeklyStepOf(after); i++) out.push(i);
  return out;
}
