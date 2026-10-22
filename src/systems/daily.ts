/**
 * 📅 오늘의 도전 — 날마다 바뀌는 규칙 관문(하루 첫 승리에 큰 보상). 순수 로직(Vitest 검증). 계획: docs/hit-plan.md E
 * 관문은 '깬 관문 중 가장 높은 곳 근처', 규칙은 날짜로 돌아감 → 모두 같은 날 같은 규칙.
 */
import type { StageData } from '../types';
import { bossForStage, isBoss } from './bosses';

export type DailyRuleKey = 'ranged' | 'bossRush' | 'double' | 'overload' | 'sky' | 'magic' | 'weapons';

export interface DailyRule {
  key: DailyRuleKey;
  icon: string;
  name: string;
  desc: string;
  units?: string[]; // 이 유닛만 출전
  enemyCount?: number; // 적 수 배수
  enemyHp?: number; // 적 체력·공격 배수(관문 배율에 곱함)
  energy?: number; // 소환 에너지 충전 배수
  mana?: number; // 마나 충전 배수
  charge?: number; // 특수 무기 충전 배수
  reward: number; // 처치 골드 배수
}

export const DAILY_RULES: DailyRule[] = [
  { key: 'ranged', icon: '🏹', name: '활과 마법만', desc: '원거리 유닛만 출전 · 보상 ×2', units: ['archer', 'mage', 'earthmage', 'darkmage', 'cannon', 'cleric'], reward: 2 },
  { key: 'bossRush', icon: '👑', name: '보스 러시', desc: '웨이브마다 보스가 나와요 · 보상 ×2.5', reward: 2.5 },
  { key: 'double', icon: '💰', name: '두 배 전쟁', desc: '적이 2배 · 처치 골드 ×3', enemyCount: 2, reward: 3 },
  { key: 'overload', icon: '⚡', name: '에너지 폭주', desc: '소환 에너지 ×2 · 적 체력 ×1.6', energy: 2, enemyHp: 1.6, reward: 2 },
  { key: 'sky', icon: '🦇', name: '하늘의 습격', desc: '모든 적이 하늘에서 · 궁수가 열쇠!', reward: 2 },
  { key: 'magic', icon: '🔮', name: '마법 축제', desc: '마법 유닛만 · 마나 ×2', units: ['mage', 'earthmage', 'darkmage', 'cleric'], mana: 2, reward: 2.5 },
  { key: 'weapons', icon: '🔥', name: '무기 대잔치', desc: '특수 무기 충전 ×3 · 적 체력 ×1.4', charge: 3, enemyHp: 1.4, reward: 2 },
];

/** 이 날의 규칙(날짜 index로 돌아감) */
export function dailyRule(day: number): DailyRule {
  return DAILY_RULES[((day % DAILY_RULES.length) + DAILY_RULES.length) % DAILY_RULES.length];
}

/** 도전 관문 — 깬 관문 중 가장 높은 곳에서 0~2 아래(날마다 다름), 최소 3 */
export function dailyStageId(day: number, clearedMax: number): number {
  return Math.max(3, clearedMax - (((day % 3) + 3) % 3));
}

/** 도전이 열리는 조건 */
export const DAILY_UNLOCK = 3; // 3관문을 깨면

const SKY = ['bat', 'vampire_bat', 'ghost', 'wisp', 'banshee', 'baby_dragon'];

/** 규칙을 적용한 관문 데이터 */
export function dailyStage(base: StageData, rule: DailyRule): StageData {
  const boss = bossForStage(base.id) ?? bossForStage(Math.ceil(base.id / 10) * 10) ?? 'ogre';
  const waves = base.waves.map((w, wi) => {
    let enemies = w.enemies.map((e) => ({ ...e }));
    if (rule.enemyCount) enemies = enemies.map((e) => (isBoss(e.type) ? e : { ...e, count: Math.round(e.count * rule.enemyCount!) }));
    if (rule.key === 'sky') enemies = enemies.map((e, i) => (isBoss(e.type) ? e : { ...e, type: SKY[(i + wi) % (base.id >= 20 ? SKY.length : 3)] }));
    if (rule.key === 'bossRush') enemies = [...enemies.filter((e) => !isBoss(e.type)).map((e) => ({ ...e, count: Math.max(1, Math.round(e.count * 0.5)) })), { type: wi % 2 ? 'ogre' : boss, count: 1, interval: 1 }];
    return { ...w, enemies };
  });
  return { ...base, name: `${rule.icon} ${rule.name}`, enemyMult: (base.enemyMult ?? 1) * (rule.enemyHp ?? 1), waves };
}

/** 출전 가능한 유닛(규칙에 막히면 보유 중 허용된 것, 하나도 없으면 보유 전부) */
export function dailyUnits(rule: DailyRule, owned: string[]): string[] {
  if (!rule.units) return owned;
  const ok = owned.filter((k) => rule.units!.includes(k));
  return ok.length ? ok : owned;
}

/** 하루 첫 승리 보너스 골드 */
export function dailyBonus(stageId: number): number {
  return 300 + stageId * 20;
}
