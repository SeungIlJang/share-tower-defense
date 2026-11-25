/**
 * 🔥 따라오는 적 — 유닛(과 영웅·성·인구·에너지)을 관문 권장보다 높게 강화하면, 넘친 만큼 적도 강해짐(적 유닛·보스·적 성 체력·성 대포). 체력·공격 함께, 보스는 60%, 최대 ×6. 순수 계산(Vitest 검증).
 * 왜: 권장보다 3레벨만 높아도 전투가 한쪽으로 쏠림(12관문 권장 Lv5 = 116초·48기 소모 → Lv8 = 58초·거의 무손실).
 *     강화 수치를 깎으면 이미 키운 유닛이 약해지므로, 유닛은 그대로 두고 적이 따라오게 함.
 * 기준: (덱에서 가장 센 유닛 3기의 평균 세기 × 영웅·성·기지 강화) ÷ 그 관문 권장 세기. 넘친 만큼 적 체력·공격 ↑.
 * 왜 전부인가: 이 게임은 20%만 앞서도 웨이브를 나오는 족족 지우고 성을 2초에 부숨. 넘친 만큼의 80%·90%만 따라오게 했을 땐 12·14관문 Lv10이 60초 압승 그대로였음(자동 전투 측정).
 *     강화의 보람은 '지금 관문이 쉬워짐'이 아니라 '더 높은 관문을 깰 수 있음'으로 남음.
 * 영웅은 적과 같은 배수로 공격·방어가 오르고 체력은 그보다 더 오름(catchupHero) — 쓰러지면 패배라서.
 * 일반 관문만(무한·주간·오늘의 도전은 자체 배율).
 */
import { UNIT_TIERS, tierFromLevel, tierPerks } from './evolution';
import { skillEvery, skillMult } from './unitSkills';
import { statMult } from './upgrades';
import { recommendedLevel } from './worlds';
import { ENERGY_RATE, FOOD_BASE } from './baseUpgrades';
import { heroLvMult } from './hero';

export const CATCHUP_SHARE = 1; // 넘친 만큼 전부(80%일 땐 남는 우위 13~25%가 승부가 기우는 선과 같았고, 90%에서도 12·14관문 Lv10이 60초 압승)
export const CATCHUP_SLACK = 1; // 봐주는 폭 없음(10%였을 땐 그만큼이 그대로 우위로 남음)
export const CATCHUP_TOP = 3; // 덱에서 센 유닛 몇 기로 재나
export const CATCHUP_WEIGHTS = [0.8, 0.1, 0.1]; // 그 비중 — 가장 센 유닛이 80%
export const CATCHUP_MAX = 6.5; // 측정(12관문 병사만 Lv21 ★4, 자동 전투): ×4 = 62초 압승 · ×5.5 = 81초 승 · ×7 = 4판 중 2승(109~112초)·2패 · ×8.5·×10.7 = 영웅이 쓰러져 패배. 진행도 상한(progressCap) 뒤로는 예전 저장에서만 닿음 — 상한 — 2.5였을 땐 초반 관문에서 Lv10(★3)이면 닿아, 그 뒤 강화는 전부 그대로 우위가 됨(1관문 Lv20 = 남는 우위 4.8배). 영웅·성·마차 체력은 catchupGuard가 같이 올림
export const CATCHUP_ATK = 1; // 공격도 체력만큼(측정: 60%만 올리면 아군이 안 죽어 압승 그대로 — 12관문 Lv8 61초 vs 전부 올리면 112초)
export const CATCHUP_BOSS = 0.6; // 보스는 60%만(난이도 배수와 같은 규칙)
export const SKILL_WEIGHT = 1; // 스킬 화력을 세기에 넣는 정도(0.5 = 제곱근 · 1 = 전부)
export const SKILL_FLOOR = 4; // 이 레벨 아래의 스킬 화력은 이 레벨로 봄 — 식으로는 Lv2가 Lv4보다 17% 약하지만 측정에선 차이가 없었음(8관문 권장 Lv2 기준으로 세면 Lv10에 ×4.2 = 3판 중 2패)
export const HERO_MARGIN = 1.5; // 👑 영웅 체력은 적이 세진 폭의 1.5배만큼 — 영웅이 쓰러지면 바로 패배라, 강화했더니 지는 일이 없게(측정: 여유 없이 8관문 Lv5 ×1.8 = 2판 모두 영웅 사망)
export const CATCHUP_SHOW = 1.05; // 이 이상이면 전투 시작 때 알림

export interface DeckUnit {
  level: number;
  tier: number;
}

/**
 * ✨ 스킬로 늘어난 화력 — 스킬은 n타마다 공격력 × 스킬 배율이고, 그 배율이 레벨로 계속 오름(Lv4 평균 ×1.4 → Lv10 ×2.1 → Lv30 ×5.2).
 * 제곱근만 세면 모자람(측정: 12관문 Lv10에 ×2.4 = 62초 압승, ×3.0~3.6이어야 권장과 같은 94~118초) → 전부 셈. 낮은 레벨은 SKILL_FLOOR.
 */
export function skillFactor(level: number, tier: number): number {
  if (level <= 0) return 1;
  const lv = Math.max(SKILL_FLOOR, level);
  const p = tierPerks(tier);
  const n = Math.max(2, skillEvery(lv) - p.skillFewer);
  return Math.pow((n - 1 + skillMult(lv) * p.skillPower) / n, SKILL_WEIGHT);
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

/**
 * 덱 세기 — 센 순서로 CATCHUP_TOP기를 CATCHUP_WEIGHTS 비중으로(덱이 비면 1).
 * 가장 센 유닛이 대부분: 한 유닛만 몰아 키우면 그 유닛만 계속 뽑으면 되기 때문(12관문 병사 Lv21 + 나머지 Lv0 = 군대는 권장의 13배인데 평균으론 4.7배로만 잡혔음).
 */
export function deckPower(units: DeckUnit[]): number {
  const p = units.map((u) => unitPower(u.level, u.tier)).sort((a, b) => b - a).slice(0, CATCHUP_TOP);
  if (!p.length) return 1;
  const w = CATCHUP_WEIGHTS.slice(0, p.length);
  const sum = w.reduce((a, b) => a + b, 0);
  return p.reduce((a, b, i) => a + b * w[i], 0) / sum;
}

/** 🏰 유닛 말고 골드로 올리는 것 — 영웅·성·인구·소환 에너지 강화 레벨 */
export interface Support {
  hero: number;
  castle: number;
  pop: number;
  energy: number;
}

/** 그 강화가 군대 전체 세기에서 차지하는 몫 — 영웅 = 센 유닛 한 기, 성 = 뒤를 받치는 대포, 인구·에너지 = 한 번에 서는 병력 수 */
export const SUPPORT_SHARE: Support = { hero: 0.25, castle: 0.1, pop: 0.5, energy: 0.5 };

/** 이 관문에서 기대하는 영웅·성·기지 강화 레벨 — 권장 유닛 레벨의 절반 */
export function supportLevel(stageId: number, enemyMult: number): number {
  return Math.floor(recommendedLevel(stageId, enemyMult) / 2);
}

/** 🏰 영웅·성·인구·에너지 강화로 앞선 정도(1 = 기대만큼 또는 그 아래 — 덜 올렸다고 적이 약해지진 않음) */
export function supportPower(stageId: number, enemyMult: number, s?: Support): number {
  if (!s) return 1;
  const e = supportLevel(stageId, enemyMult);
  const part = (ratio: number, share: number): number => 1 + share * Math.max(0, ratio - 1);
  return (
    part(heroLvMult(s.hero) / heroLvMult(e), SUPPORT_SHARE.hero) *
    part((1 + 0.12 * s.castle) / (1 + 0.12 * e), SUPPORT_SHARE.castle) *
    part((FOOD_BASE + 5 * s.pop) / (FOOD_BASE + 5 * e), SUPPORT_SHARE.pop) *
    part((ENERGY_RATE + s.energy) / (ENERGY_RATE + e), SUPPORT_SHARE.energy)
  );
}

/** 🔥 적 체력·공격 추가 배수(1 = 그대로) */
export function catchupMult(stageId: number, enemyMult: number, units: DeckUnit[], support?: Support): number {
  const over = (deckPower(units) * supportPower(stageId, enemyMult, support)) / (expectedPower(stageId, enemyMult) * CATCHUP_SLACK);
  if (over <= 1) return 1;
  return Math.round(Math.min(CATCHUP_MAX, 1 + CATCHUP_SHARE * (over - 1)) * 100) / 100;
}

/** 👑 영웅 체력에 곱할 값 — 적 공격이 오른 폭 × HERO_MARGIN */
export function catchupHero(mult: number): number {
  return 1 + (mult - 1) * HERO_MARGIN;
}

/** 🔥 적 한 마리에 실제로 곱할 값 — 체력·공격 함께, 보스는 전체의 60%만 */
export function catchupParts(mult: number, boss = false): { hp: number; atk: number } {
  const hp = boss ? 1 + (mult - 1) * CATCHUP_BOSS : mult;
  return { hp, atk: 1 + (hp - 1) * CATCHUP_ATK };
}
