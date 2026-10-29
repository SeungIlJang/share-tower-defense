/**
 * 🎁 진화 사이 작은 보상 — 진화(Lv5·10·20·…·100) 사이 Lv15·25·…·95에 보상, Lv100 넘으면 5레벨마다. 순수 로직(Vitest 검증).
 * 유닛 분류마다 보상 순서가 다름(근접 = 체력 · 원거리 = 사거리 · 설치물 = 설치 시간), Lv100 이후는 모두 ❤️⚔️ +3%.
 *   ⚔️ 근접:   ⚡ 소환 비용 −3 → ❤️ 체력 +6% → ⏱️ 재소환 대기 −5% → ❤️⚔️ +3%
 *   🏹 원거리: ⚡ 소환 비용 −3 → 🎯 사거리 +10 → ✨ 스킬 위력 +5% → ❤️⚔️ +3%
 *   🗿 설치물: ⚡ 소환 비용 −3 → ⏳ 설치 시간 +5초 → ⏱️ 재소환 대기 −5% → ❤️⚔️ +3%
 */
import type { UnitGroup } from './unitGroups';

export type MilestoneKind = 'cost' | 'cooldown' | 'skill' | 'stats' | 'hp' | 'range' | 'life';

export const MILESTONE_TEXT: Record<MilestoneKind, string> = {
  cost: '⚡ 소환 비용 −3',
  cooldown: '⏱️ 재소환 대기 −5%',
  skill: '✨ 스킬 위력 +5%',
  stats: '❤️⚔️ +3%',
  hp: '❤️ 체력 +6%',
  range: '🎯 사거리 +10',
  life: '⏳ 설치 시간 +5초',
};
const CYCLE: Record<UnitGroup, MilestoneKind[]> = {
  melee: ['cost', 'hp', 'cooldown', 'stats'],
  ranged: ['cost', 'range', 'skill', 'stats'],
  totem: ['cost', 'life', 'cooldown', 'stats'],
};

/** n번째(0부터) 보상 레벨 — 15, 25, …, 95, 그 뒤 105, 110, 115 … */
export function milestoneLevel(n: number): number {
  return n < 9 ? 15 + n * 10 : 105 + (n - 9) * 5;
}

export function milestoneKind(n: number, group: UnitGroup = 'melee'): MilestoneKind {
  const c = CYCLE[group];
  return n < 9 ? c[n % c.length] : 'stats';
}

/** 이 레벨까지 받은 보상 수 */
export function milestonesAt(lv: number): number {
  let n = 0;
  while (milestoneLevel(n) <= lv) n++;
  return n;
}

export interface MilestoneBonus {
  costDown: number;
  cooldown: number; // 재소환 대기 배수
  skill: number; // 스킬 위력 배수
  stats: number; // ❤️⚔️ 배수
  hp: number; // 체력 배수(근접)
  range: number; // 사거리 +px(원거리)
  life: number; // 설치 시간 +초(설치물)
}

/** 받은 보상 합계 */
export function milestoneBonus(lv: number, group: UnitGroup = 'melee'): MilestoneBonus {
  const b: MilestoneBonus = { costDown: 0, cooldown: 1, skill: 1, stats: 1, hp: 1, range: 0, life: 0 };
  const n = milestonesAt(lv);
  for (let i = 0; i < n; i++) {
    const k = milestoneKind(i, group);
    if (k === 'cost') b.costDown += 3;
    else if (k === 'cooldown') b.cooldown *= 0.95;
    else if (k === 'skill') b.skill += 0.05;
    else if (k === 'hp') b.hp += 0.06;
    else if (k === 'range') b.range += 10;
    else if (k === 'life') b.life += 5;
    else b.stats += 0.03;
  }
  return b;
}

/** 다음 보상 — 레벨 · 내용 · 진행(지난 보상/진화 레벨부터) */
export function nextMilestone(lv: number, prevAnchor: number, group: UnitGroup = 'melee'): { lv: number; text: string; ratio: number; left: number } {
  const n = milestonesAt(lv);
  const at = milestoneLevel(n);
  const from = Math.max(prevAnchor, n > 0 ? milestoneLevel(n - 1) : 0);
  return { lv: at, text: MILESTONE_TEXT[milestoneKind(n, group)], ratio: Math.min(1, Math.max(0, (lv - from) / Math.max(1, at - from))), left: at - lv };
}

/** 소환 비용(최소 5) */
export function milestoneCost(cost: number, lv: number): number {
  return Math.max(5, cost - milestoneBonus(lv).costDown);
}
