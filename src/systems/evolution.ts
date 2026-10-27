/**
 * ⭐ 유닛 진화 — 12단계(★1~★5 + 🌟초월 1~7, 기준 Lv 0·5·10·20·30·40·50·60·70·80·90·100). 순수 계산(Vitest 검증). 분석: 진화가 Lv5·Lv10뿐이라 후반(Lv10~32)에 변화가 없던 문제.
 * - 🔓 돌파: 레벨은 다음 단계 시작 레벨에서 멈춤 → '⭐ 진화'(골드 + 그 유닛 카드 조각)로 다음 단계 → 다시 강화.
 * - 💪 진화 보너스: 단계마다 체력·공격 배수, ★3 스킬 위력 ↑, ★4 스킬 더 자주, ★5 각성(공격 속도·치명타).
 * - 🎨 그림: ★2 = '<키>_t2' · ★3 = '<키>_t3' · ★4·★5 = '<키>_t4'·'_t5'(없으면 아래 단계 그림 + 금빛·무지개 오라).
 *   기본 그림 키 = 유닛(예: mage), 전설 = 'mage@legend'. 그 단계 그림이 아직 없으면 아래 단계 그림을 씀.
 * 예전 저장(레벨로만 진화): 이미 Lv5↑ = ★2, Lv10↑ = ★3, 새 기준(Lv20·30·…)을 넘었으면 그 단계로 자동.
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
  { min: 10, stars: 3, name: '영웅', mult: 1.2, gold: 1500, shards: 15, perk: '❤️⚔️ +20% · ✨ 스킬 위력 ×1.25' },
  { min: 20, stars: 4, name: '마스터', mult: 1.32, gold: 4000, shards: 30, perk: '❤️⚔️ +32% · ✨ 스킬 더 자주' },
  { min: 30, stars: 5, name: '각성', mult: 1.45, gold: 9000, shards: 60, perk: '❤️⚔️ +45% · 🔥 각성(공격 속도 +20% · 치명타 +10%)' },
  // 🌟 초월 1~7 — Lv40~100(무한 모드·주간 보스용 긴 목표), 단계마다 ❤️⚔️ +10%p, 3·5·7단계는 특수 보너스
  { min: 40, stars: 6, name: '초월 1', mult: 1.55, gold: 15000, shards: 80, perk: '❤️⚔️ +55%' },
  { min: 50, stars: 7, name: '초월 2', mult: 1.65, gold: 22000, shards: 100, perk: '❤️⚔️ +65%' },
  { min: 60, stars: 8, name: '초월 3', mult: 1.75, gold: 30000, shards: 120, perk: '❤️⚔️ +75% · ✨ 스킬 한 번 더 자주' },
  { min: 70, stars: 9, name: '초월 4', mult: 1.85, gold: 40000, shards: 150, perk: '❤️⚔️ +85%' },
  { min: 80, stars: 10, name: '초월 5', mult: 1.95, gold: 52000, shards: 180, perk: '❤️⚔️ +95% · 🔥 공격 속도 +30%' },
  { min: 90, stars: 11, name: '초월 6', mult: 2.05, gold: 66000, shards: 210, perk: '❤️⚔️ +105%' },
  { min: 100, stars: 12, name: '초월 7', mult: 2.15, gold: 82000, shards: 250, perk: '❤️⚔️ +115% · 💥 치명타 +20%' },
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
    skillFewer: t >= 7 ? 2 : t >= 3 ? 1 : 0, // 스킬이 공격 한(두) 번 더 빨리
    atkSpeed: t >= 9 ? 1.3 : t >= 4 ? 1.2 : 1,
    crit: t >= 11 ? 0.2 : t >= 4 ? 0.1 : 0,
  };
}

/** ★ 표시 — ★1~★5는 ★★☆☆☆, 초월은 ★★★★★🌟N */
export function starText(tier: number): string {
  const s = UNIT_TIERS[Math.max(0, Math.min(MAX_TIER, tier))].stars;
  return s <= 5 ? '★'.repeat(s) + '☆'.repeat(5 - s) : `★★★★★🌟${s - 5}`;
}

/** 전투 머리 위 별(짧게) — ★★★ / 초월은 🌟N */
export function headStars(stars: number): string {
  return stars <= 5 ? '★'.repeat(stars) : `🌟${stars - 5}`;
}

/** 몸 크기 — 진화할수록 아주 조금씩(★4부터, ★3 그림을 같이 쓰는 단계) · 초월 7 = ×1.11 */
export function tierBodyScale(tier: number): number {
  return 1 + 0.02 * Math.min(3, Math.max(0, tier - 2)) + 0.008 * Math.max(0, tier - 5);
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
