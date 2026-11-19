/**
 * 🔥 따라오는 적 — 유닛을 관문 권장보다 높게 강화하면, 넘친 만큼의 80%는 적도 강해짐(적 유닛·보스·적 성 체력·성 대포). 체력·공격 함께, 보스는 60%, 최대 ×2.5. 순수 계산(Vitest 검증).
 * 왜: 권장보다 3레벨만 높아도 전투가 한쪽으로 쏠림(12관문 권장 Lv5 = 116초·48기 소모 → Lv8 = 58초·거의 무손실).
 *     강화 수치를 깎으면 이미 키운 유닛이 약해지므로, 유닛은 그대로 두고 적이 따라오게 함.
 * 기준: 덱에서 가장 센 유닛 3기의 평균 세기 ÷ 그 관문 권장 세기. 10%까지는 그대로, 그 위로 넘친 비율의 80%만큼 적 체력·공격 ↑.
 * 왜 절반이 아니라 80%인가: 이 게임은 20%만 앞서도 웨이브를 나오는 족족 지우고 성을 2초에 부숨(자동 전투 측정 — 절반일 땐 12·19관문이 그대로 60초 압승).
 * 일반 관문만(무한·주간·오늘의 도전은 자체 배율).
 */
import { UNIT_TIERS, tierFromLevel, tierPerks } from './evolution';
import { skillEvery, skillMult } from './unitSkills';
import { statMult } from './upgrades';
import { recommendedLevel } from './worlds';

export const CATCHUP_SHARE = 0.8; // 넘친 만큼의 80%
export const CATCHUP_SLACK = 1.1; // 이만큼까지는 그대로(조금 앞서는 건 보상)
export const CATCHUP_TOP = 3; // 덱에서 센 유닛 몇 기로 재나(한두 기만 몰아 키워도 잡힘)
export const CATCHUP_MAX = 2.5; // 상한 — 영웅·우리 성은 유닛 강화와 무관해서, 적이 끝없이 세지면 한참 앞선 사람이 옛 관문에서 지게 됨(측정: 20관문 Lv30 ×6 = 패배)
export const CATCHUP_ATK = 1; // 공격도 체력만큼(측정: 60%만 올리면 아군이 안 죽어 압승 그대로 — 12관문 Lv8 61초 vs 전부 올리면 112초)
export const CATCHUP_BOSS = 0.6; // 보스는 60%만(난이도 배수와 같은 규칙)
export const CATCHUP_SHOW = 1.05; // 이 이상이면 전투 시작 때 알림

export interface DeckUnit {
  level: number;
  tier: number;
}

/**
 * ✨ 스킬로 늘어난 화력 — 스킬은 n타마다 공격력 × 스킬 배율이고, 그 배율이 레벨로 계속 오름(Lv4 평균 ×1.4 → Lv10 ×2.1 → Lv30 ×5.2).
 * 화력만 늘리는 요소라 체력·공격을 함께 올리는 적 배수로 맞추려면 제곱근만큼만 셈.
 */
export function skillFactor(level: number, tier: number): number {
  if (level <= 0) return 1;
  const p = tierPerks(tier);
  const n = Math.max(2, skillEvery(level) - p.skillFewer);
  return Math.sqrt((n - 1 + skillMult(level) * p.skillPower) / n);
}

/** 유닛 한 기의 세기 — 강화 배율 × 진화 배율 × 스킬 화력 */
export function unitPower(level: number, tier: number): number {
  const t = Math.max(0, Math.min(UNIT_TIERS.length - 1, tier));
  return statMult(Math.max(0, level)) * UNIT_TIERS[t].mult * skillFactor(level, t);
}

/** 이 관문에서 기대하는 세기 — 권장 레벨(그 레벨에서 할 수 있는 진화 포함) */
export function expectedPower(stageId: number, enemyMult: number): number {
  const lv = recommendedLevel(stageId, enemyMult);
  return unitPower(lv, tierFromLevel(lv));
}

/** 덱 세기 — 센 순서로 CATCHUP_TOP기 평균(덱이 비면 1) */
export function deckPower(units: DeckUnit[]): number {
  const p = units.map((u) => unitPower(u.level, u.tier)).sort((a, b) => b - a).slice(0, CATCHUP_TOP);
  return p.length ? p.reduce((a, b) => a + b, 0) / p.length : 1;
}

/** 🔥 적 체력·공격 추가 배수(1 = 그대로) */
export function catchupMult(stageId: number, enemyMult: number, units: DeckUnit[]): number {
  const over = deckPower(units) / (expectedPower(stageId, enemyMult) * CATCHUP_SLACK);
  if (over <= 1) return 1;
  return Math.round(Math.min(CATCHUP_MAX, 1 + CATCHUP_SHARE * (over - 1)) * 100) / 100;
}

/** 🔥 적 한 마리에 실제로 곱할 값 — 체력·공격 함께, 보스는 전체의 60%만 */
export function catchupParts(mult: number, boss = false): { hp: number; atk: number } {
  const hp = boss ? 1 + (mult - 1) * CATCHUP_BOSS : mult;
  return { hp, atk: 1 + (hp - 1) * CATCHUP_ATK };
}
