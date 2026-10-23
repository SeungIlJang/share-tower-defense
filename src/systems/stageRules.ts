/**
 * 🎯 특수 관문 규칙 + ⏱️ 목표 시간 — 순수 로직(Vitest 검증). 분석: docs/paladog-apk-analysis.md ①④
 * 월드마다 3번째 = 🛒 마차 호위, 7번째 = 🏰 수성, 8번째 = 🏃 돌파(5·10 보스 관문은 그대로).
 * 1월드 3관문은 첫 경험(특수 무기 해금) 관문이라 일반 관문으로 둠.
 */
import type { StageData } from '../types';

export type StageRule = 'normal' | 'escort' | 'hold' | 'breach';

export interface RuleInfo {
  icon: string;
  name: string;
  desc: string;
}

export const RULE_INFO: Record<Exclude<StageRule, 'normal'>, RuleInfo> = {
  escort: { icon: '🛒', name: '마차 호위', desc: '짐마차가 적 성에 닿으면 승리! 마차가 부서지면 패배' },
  hold: { icon: '🏰', name: '수성', desc: '시간이 끝날 때까지 우리 성을 지키면 승리! 적이 점점 빨리 몰려와요' },
  breach: { icon: '🏃', name: '돌파', desc: '아군을 적 성 너머 결승선까지 보내면 승리! 빠른 유닛이 유리해요' },
};

/** 관문 규칙 */
export function stageRule(id: number): StageRule {
  const slot = ((id - 1) % 10) + 1;
  if (slot === 3 && id > 10) return 'escort';
  if (slot === 7) return 'hold';
  if (slot === 8) return 'breach';
  return 'normal';
}

/** 🛒 마차 — 체력(우리 성 체력의 비율), 속도(px/초), 앞에 적이 이만큼 가까우면 멈춤 */
export const WAGON_SPEED = 22;
export const WAGON_BLOCK = 55;
export function wagonHp(baseHp: number, enemyMult: number): number {
  return Math.round(baseHp * 4 * Math.max(1, enemyMult * 0.6));
}

/** 🏰 수성 — 버틸 시간(초): 75초 + 월드마다 5초 */
export function holdSeconds(id: number): number {
  return 75 + 5 * (Math.ceil(id / 10) - 1);
}

/** 🏰 수성 — 시간이 갈수록 적 생산 간격이 짧아짐(최소 40%) */
export function holdProdMult(elapsed: number, total: number): number {
  return Math.max(0.4, 1 - 0.6 * Math.min(1, elapsed / total));
}

/** 🏃 돌파 — 결승선까지 보내야 할 아군 수: 6명 + 월드마다 1명(최대 15) */
export function breachGoal(id: number): number {
  return Math.min(15, 6 + Math.ceil(id / 10) - 1);
}

/** ⏱️ 목표 시간(초) — 마지막 웨이브 + 여유, 10초 단위로 올림. 수성은 버티는 시간이라 없음(null) */
export function targetTime(stage: StageData, rule: StageRule = stageRule(stage.id)): number | null {
  if (rule === 'hold') return null;
  const last = Math.max(0, ...stage.waves.map((w) => w.at));
  const extra = 70 + 4 * (Math.ceil(stage.id / 10) - 1) + (rule === 'normal' ? 0 : 30);
  return Math.ceil((last + extra) / 10) * 10;
}

/** ⏱️ 목표 시간 안에 깨면 받는 보너스 골드(월드 배율 곱하기 전) */
export function targetBonus(id: number): number {
  return 40 + id * 4;
}
