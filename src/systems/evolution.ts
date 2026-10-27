/**
 * ⭐ 유닛 진화 — 5단계(★1~★5). 순수 계산(Vitest 검증). 분석: 진화가 Lv5·Lv10뿐이라 후반(Lv10~32)에 변화가 없던 문제.
 * - 🔓 돌파: 레벨은 다음 단계 시작 레벨에서 멈춤 → '⭐ 진화'(골드 + 그 유닛 카드 조각)로 다음 단계 → 다시 강화.
 * - 💪 진화 보너스: 단계마다 체력·공격 배수, ★3 스킬 위력 ↑, ★4 스킬 더 자주, ★5 각성(공격 속도·치명타).
 * - 🎨 그림: ★2 = '<키>_t2' · ★3 = '<키>_t3' · ★4·★5 = '<키>_t4'·'_t5'(없으면 아래 단계 그림 + 금빛·무지개 오라).
 *   기본 그림 키 = 유닛(예: mage), 전설 = 'mage@legend'. 그 단계 그림이 아직 없으면 아래 단계 그림을 씀.
 * 예전 저장(레벨로만 진화): 이미 Lv5↑ = ★2, Lv10↑ = ★3, 새 기준(Lv20·30)을 넘었으면 그 단계로 자동.
 */

export interface UnitTier {
  min: number; // 이 단계로 진화할 수 있는 레벨(= 아래 단계의 최고 레벨)
  stars: number;
  name: string;
  mult: number; // 체력·공격 배수
  gold: number; // 진화 비용(골드)
  shards: number; // 진화 비용(그 유닛 카드 조각)
  perk: string; // 이 단계에서 새로 생기는 것(안내)
}

export const UNIT_TIERS: UnitTier[] = [
  { min: 0, stars: 1, name: '기본', mult: 1, gold: 0, shards: 0, perk: '' },
  { min: 5, stars: 2, name: '숙련', mult: 1.1, gold: 300, shards: 0, perk: '❤️⚔️ +10%' },
  { min: 12, stars: 3, name: '영웅', mult: 1.2, gold: 1500, shards: 15, perk: '❤️⚔️ +20% · ✨ 스킬 위력 ×1.25' },
  { min: 20, stars: 4, name: '마스터', mult: 1.32, gold: 4000, shards: 30, perk: '❤️⚔️ +32% · ✨ 스킬 더 자주' },
  { min: 30, stars: 5, name: '각성', mult: 1.45, gold: 9000, shards: 60, perk: '❤️⚔️ +45% · 🔥 각성(공격 속도 +20% · 치명타 +10%)' },
];
export const MAX_TIER = UNIT_TIERS.length - 1;

/** 이 단계에서 올릴 수 있는 최고 레벨(다음 단계 진화 레벨) — 마지막 단계는 끝없음 */
export function levelCap(tier: number): number {
  return UNIT_TIERS[tier + 1]?.min ?? Infinity;
}

/** 다음 진화(없으면 null) */
export function nextUnitTier(tier: number): UnitTier | null {
  return UNIT_TIERS[tier + 1] ?? null;
}

/** 진화할 때가 됐나(레벨이 다음 단계 시작 레벨에 닿음) */
export function readyToEvolve(lv: number, tier: number): boolean {
  const n = nextUnitTier(tier);
  return !!n && lv >= n.min;
}

/** 레벨만으로 정한 단계(새 기준) */
export function tierFromLevel(lv: number): number {
  let t = 0;
  UNIT_TIERS.forEach((u, i) => {
    if (lv >= u.min) t = i;
  });
  return t;
}

/** 예전 저장 이전 — 예전 기준(Lv5 ★2 · Lv10 ★3)과 새 기준 중 높은 쪽(이미 얻은 단계는 안 잃음) */
export function migrateTier(lv: number): number {
  const old = lv >= 10 ? 2 : lv >= 5 ? 1 : 0;
  return Math.max(old, tierFromLevel(lv));
}

/** 💪 단계 보너스 */
export function tierPerks(tier: number): { mult: number; skillPower: number; skillFewer: number; atkSpeed: number; crit: number } {
  const t = Math.max(0, Math.min(MAX_TIER, tier));
  return {
    mult: UNIT_TIERS[t].mult,
    skillPower: t >= 2 ? 1.25 : 1,
    skillFewer: t >= 3 ? 1 : 0, // 스킬이 공격 한 번 더 빨리
    atkSpeed: t >= 4 ? 1.2 : 1,
    crit: t >= 4 ? 0.1 : 0,
  };
}

/** ★ 표시(★★☆☆☆ 처럼) */
export function starText(tier: number): string {
  const s = UNIT_TIERS[Math.max(0, Math.min(MAX_TIER, tier))].stars;
  return '★'.repeat(s) + '☆'.repeat(UNIT_TIERS.length - s);
}

/** 단계별 그림 키 */
export function tierKey(unit: string, legend: boolean, tier: number): string {
  const base = legend ? `${unit}@legend` : unit;
  return tier <= 0 ? base : `${base}_t${tier + 1}`;
}

/** 지금 단계에서 쓸 그림 — 그 단계 그림이 없으면 아래 단계로, 전설 그림이 하나도 없으면 null */
export function evolvedKey(unit: string, tier: number, legend: boolean, has: (key: string) => boolean): string | null {
  for (let t = Math.min(tier, MAX_TIER); t >= 0; t--) {
    const k = tierKey(unit, legend, t);
    if (has(k)) return k;
  }
  return legend ? null : unit;
}

/** 진화 그림 키 → 유닛 이름(mage_t2 · mage@legend_t3 → mage) */
export function unitOfKey(key: string): string {
  return key.split('@')[0].replace(/_t\d$/, '');
}

/** 앱 시작 때 받을 유닛 그림 — 유닛마다 기본(★1) + 지금 단계 + (전설 착용 시) 전설 지금 단계 */
export function unitPreloadKeys(units: string[], inManifest: (key: string) => boolean, tierOf: (unit: string) => number, equipped: (unit: string) => string | null): Set<string> {
  const out = new Set<string>();
  for (const u of units) {
    const t = tierOf(u);
    out.add(u);
    const k = evolvedKey(u, t, false, inManifest);
    if (k) out.add(k);
    if (equipped(u) === 'legend') {
      const l = evolvedKey(u, t, true, inManifest);
      if (l) out.add(l);
    }
  }
  return out;
}
