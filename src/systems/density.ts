/**
 * 👥 적 밀도 — 적을 덜 나오게 하고 그만큼 한 마리를 세게. 순수 로직(Vitest 검증).
 * 무리 지어 뭉개져 보이던 전장을 한 마리 한 마리 싸우는 모습이 보이게.
 * 총합은 그대로: 체력·공격·보상(골드·경험치)을 1/밀도 배 → 난이도·수입이 거의 같음.
 * 보스·보스가 부르는 부하·분열·엘리트 부대는 손대지 않음.
 */
import type { StageData } from '../types';
import { isBoss } from './bosses';

export const ENEMY_DENSITY = 0.45; // 적 수 45% — 숫자 하나로 조절(한 마리는 ×2.2)
export const DENSE_MULT = 1 / ENEMY_DENSITY; // 그만큼 한 마리 체력·공격·보상 배수
export const ENEMY_POWER = 1.25; // 💪 난이도 — 적 체력·공격 추가 배수(보상은 그대로)
export const EASY_UNTIL = 3; // 이 관문까지는 처음 하는 사람용으로 추가 배수 없음

/** 💪 이 관문 적의 추가 세기 — 1~3관문 ×1, 4관문부터(무한 포함) ×1.25. 보스는 그 60%만 */
export function enemyPower(stageId: number, endless: boolean, boss = false): number {
  const p = endless || stageId > EASY_UNTIL ? ENEMY_POWER : 1;
  return boss ? 1 + (p - 1) * 0.6 : p;
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
