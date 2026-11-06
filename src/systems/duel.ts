/**
 * ⚔️ 일기토(1:1 결투) — 순수 로직(Vitest 검증).
 * B) 전투 도중 적장이 일기토를 신청(보스 관문은 꼭, 일반 관문은 가끔) — 이기면 적 사기 저하, 지면 적이 잠깐 강해짐.
 * A) 일기토 관문 — 월드마다 6번째 관문(2월드부터)은 일기토 한 판으로 승부.
 * 적장 능력치는 고른 유닛에 맞춰 정함 → 그냥 두면 살짝 지는 승부. 상성(×1.5)과 ⚔️ 필살(PERFECT)로 이기게.
 */
import type { CombatStats, StageData } from '../types';
import { computeDamage } from './combat';

export const DUEL_CHANCE = 0.25; // 일반 관문에서 적장이 나올 확률
export const DUEL_FROM = 9; // 이 관문부터(8관문을 깨면) — 🎓 FEATURES.duel 과 같음
export const DUEL_LIMIT = 40; // 결투 제한 시간(초) — 넘으면 남은 체력 비율로 판정
export const SPECIAL_MULT = 3; // ⚔️ 필살(PERFECT) 피해 배수
export const SPECIAL_CD = 2.5; // 필살 다시 쓰기까지(초)
export const WIN_MORALE = 0.8; // 이기면 남은 적 공격력 ×0.8
export const LOSE_RAGE = 1.2; // 지면 적 공격력 ×1.2
export const LOSE_RAGE_SEC = 20;

/** 전투 중 적장이 나오나 — 보스 관문(5·10번째)은 꼭, 일반 관문은 25%. 특수 관문(호위·수성·돌파·일기토)은 없음 */
export function duelPlanned(stageId: number, rule: string, rnd: () => number): boolean {
  if (rule !== 'normal' || stageId < DUEL_FROM) return false;
  if (stageId % 5 === 0) return true;
  return rnd() < DUEL_CHANCE;
}

/** 적장이 나오는 시각(초) — 마지막 웨이브 시작의 45%쯤(최소 15초) */
export function duelTime(stage: StageData): number {
  const last = Math.max(0, ...stage.waves.map((w) => w.at));
  return Math.max(15, Math.round(last * 0.45));
}

/** 적장 종류 — 이 관문 적 중 가장 센(체력×공격) 일반 적 */
export function pickChampion(types: string[], stats: Record<string, { hp: number; atk: number }>, isBoss: (t: string) => boolean): string {
  let best = '';
  let score = -1;
  for (const t of types) {
    const s = stats[t];
    if (!s || isBoss(t)) continue;
    if (s.hp * s.atk > score) {
      score = s.hp * s.atk;
      best = t;
    }
  }
  return best || 'orc';
}

/**
 * 적장 능력치 — 고른 유닛 기준. 유닛이 그냥 때리면 winSec초에 쓰러지고, 적장은 유닛을 loseSec초에 쓰러뜨림.
 * 기본(전투 중)은 18초 vs 12초, 일기토 관문은 21초 vs 11초.
 * (실측: 유닛 스킬·치명타·영웅 오라 덕에 계산보다 ~30% 빨리 이김 → 실제로는 '필살 없이는 아슬아슬하게 짐, 필살 2~3번이면 이김')
 */
export function duelFoeStats(ally: CombatStats, base: CombatStats, hard = false): CombatStats {
  const winSec = hard ? 21 : 18;
  const loseSec = hard ? 11 : 12;
  const allyDps = computeDamage(ally.atk, base.def) * ally.atkSpeed;
  const hp = Math.max(50, Math.round(allyDps * winSec));
  const hit = ally.hp / loseSec / Math.max(0.2, base.atkSpeed);
  const atk = Math.max(1, Math.round(hit + ally.def * 0.5));
  return { ...base, hp, atk };
}
