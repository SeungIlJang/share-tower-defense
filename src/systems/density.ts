/**
 * 👥 적 밀도 — 적을 덜 나오게 하고 그만큼 한 마리를 세게. 순수 로직(Vitest 검증).
 * 무리 지어 뭉개져 보이던 전장을 한 마리 한 마리 싸우는 모습이 보이게.
 * 총합은 그대로: 체력·공격·보상(골드·경험치)을 1/밀도 배 → 난이도·수입이 거의 같음.
 * 보스·보스가 부르는 부하·분열·엘리트 부대는 손대지 않음.
 */
import type { StageData } from '../types';
import { isBoss } from './bosses';

export const ENEMY_DENSITY = 0.8; // 적 수 80% — 숫자 하나로 조절(한 마리는 ×1.25). 0.45였을 땐 한 마리가 너무 안 죽어 전투가 늘어짐
export const DENSE_MULT = 1 / ENEMY_DENSITY; // 그만큼 한 마리 체력·공격·보상 배수
export const ENEMY_POWER = 1.25; // 💪 난이도 — 적 체력·공격 추가 배수(보상은 그대로)
export const EASY_UNTIL = 3; // 이 관문까지는 처음 하는 사람용으로 추가 배수 없음

/** 4~5관문은 계단 — 첫 3관문(약한 적 떼)에서 갑자기 세지지 않게 */
const POWER_RAMP: Record<number, number> = { 4: 1.08, 5: 1.16 };

/** 💪 이 관문 적의 추가 세기 — 1~3관문 ×1, 4관문 ×1.08 · 5관문 ×1.16, 6관문부터(무한 포함) ×1.25. 보스는 그 60%만 */
export function enemyPower(stageId: number, endless: boolean, boss = false): number {
  const p = endless ? ENEMY_POWER : stageId > EASY_UNTIL ? POWER_RAMP[stageId] ?? ENEMY_POWER : 1;
  return boss ? 1 + (p - 1) * 0.6 : p;
}

/**
 * 🍿 첫 3관문 — 약한 적이 떼로(한두 방에 쓰러지는 맛). 수를 줄이지 않고(밀도 1), 한 마리는 약하게, 빨리 몰려나옴.
 * 처음 하는 사람이 '적 한 마리를 17초 때리는' 화면을 보고 떠나지 않게. 보스는 그대로.
 */
export const EARLY_UNTIL = 3;
export interface EarlyTune {
  hp: number; // 적 체력 배수
  atk: number; // 적 공격 배수
  gap: number; // 웨이브 안 한 마리 간격(초)
  rest: number; // 웨이브 사이 휴식(초)
  castle: number; // 적 성 체력 배수(웨이브를 다 보기 전에 끝나지 않게)
  xp: number; // 경험치 배수(적이 많아 레벨업 카드 창이 너무 자주 뜨지 않게 — 골드는 그대로)
  walk: number; // 걷는 속도 배수(양쪽 모두 — 첫 충돌까지 기다리는 시간을 줄임)
}
const EARLY: Record<number, EarlyTune> = {
  1: { hp: 0.45, atk: 1, gap: 0.55, rest: 5, castle: 5, xp: 0.35, walk: 1.35 },
  2: { hp: 0.55, atk: 1.25, gap: 0.55, rest: 5, castle: 5, xp: 0.35, walk: 1.35 },
  3: { hp: 0.65, atk: 1.5, gap: 0.6, rest: 5, castle: 5, xp: 0.35, walk: 1.35 },
};

/** 이 관문의 첫 경험 조정(일반 관문 1~3만 — 무한·도전·주간은 없음) */
export function earlyTune(stageId: number, special = false): EarlyTune | null {
  return special ? null : EARLY[stageId] ?? null;
}

/** n마리 → 줄인 마릿수(최소 1) */
export function thinCount(n: number): number {
  return Math.max(1, Math.round(n * ENEMY_DENSITY));
}

/** 관문 웨이브를 줄임 — 마릿수 ×밀도, 간격은 늘려서 같은 시간 동안 나오게. 보스는 그대로 */
export function thinStage(stage: StageData): StageData {
  return {
    ...stage,
    waves: stage.waves.map((w) => ({
      ...w,
      enemies: w.enemies.map((g) => {
        if (isBoss(g.type) || g.count <= 1) return g;
        const count = thinCount(g.count);
        return { ...g, count, interval: count > 1 ? (g.interval * (g.count - 1)) / (count - 1) : g.interval };
      }),
    })),
  };
}
