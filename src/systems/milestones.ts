/**
 * 🎁 진화 사이 작은 보상 — 진화(Lv5·10·20·…·100) 사이 Lv15·25·…·95에 보상, Lv100 넘으면 5레벨마다. 순수 로직(Vitest 검증).
 * 보상은 차례로 돌아감: ⚡ 소환 비용 −3 → ⏱️ 재소환 대기 −5% → ✨ 스킬 위력 +5% → ❤️⚔️ +3%  (Lv100 이후는 ❤️⚔️ +3%만)
 */
export type MilestoneKind = 'cost' | 'cooldown' | 'skill' | 'stats';

export const MILESTONE_TEXT: Record<MilestoneKind, string> = {
  cost: '⚡ 소환 비용 −3',
  cooldown: '⏱️ 재소환 대기 −5%',
  skill: '✨ 스킬 위력 +5%',
  stats: '❤️⚔️ +3%',
};
const CYCLE: MilestoneKind[] = ['cost', 'cooldown', 'skill', 'stats'];

/** n번째(0부터) 보상 레벨 — 15, 25, …, 95, 그 뒤 105, 110, 115 … */
export function milestoneLevel(n: number): number {
  return n < 9 ? 15 + n * 10 : 105 + (n - 9) * 5;
}

export function milestoneKind(n: number): MilestoneKind {
  return n < 9 ? CYCLE[n % CYCLE.length] : 'stats';
}

/** 이 레벨까지 받은 보상 수 */
export function milestonesAt(lv: number): number {
  let n = 0;
  while (milestoneLevel(n) <= lv) n++;
  return n;
}

/** 받은 보상 합계 */
export function milestoneBonus(lv: number): { costDown: number; cooldown: number; skill: number; stats: number } {
  const b = { costDown: 0, cooldown: 1, skill: 1, stats: 1 };
  const n = milestonesAt(lv);
  for (let i = 0; i < n; i++) {
    const k = milestoneKind(i);
    if (k === 'cost') b.costDown += 3;
    else if (k === 'cooldown') b.cooldown *= 0.95;
    else if (k === 'skill') b.skill += 0.05;
    else b.stats += 0.03;
  }
  return b;
}

/** 다음 보상 — 레벨 · 내용 · 진행(지난 보상/진화 레벨부터) */
export function nextMilestone(lv: number, prevAnchor: number): { lv: number; text: string; ratio: number; left: number } {
  const n = milestonesAt(lv);
  const at = milestoneLevel(n);
  const from = Math.max(prevAnchor, n > 0 ? milestoneLevel(n - 1) : 0);
  return { lv: at, text: MILESTONE_TEXT[milestoneKind(n)], ratio: Math.min(1, Math.max(0, (lv - from) / Math.max(1, at - from))), left: at - lv };
}

/** 소환 비용(최소 5) */
export function milestoneCost(cost: number, lv: number): number {
  return Math.max(5, cost - milestoneBonus(lv).costDown);
}
