/**
 * ⭐ 유닛 진화 — 유닛 강화 레벨에 따라 그림이 바뀜(스킨별). 순수 계산(Vitest 검증).
 * ★1 Lv0~4 = 지금 그림 · ★2 Lv5~9 = '<키>_t2' · ★3 Lv10+ = '<키>_t3'
 * 기본 그림 키 = 유닛(예: mage), 전설 = 'mage@legend'. 레어는 그림 없이 기본 단계 그림의 색만 바꿈.
 * 그 단계 그림이 아직 없으면 아래 단계 그림을 씀(프롬프트: docs/unit-evolution-prompts.md).
 */

export interface UnitTier {
  min: number; // 이 레벨부터
  stars: number;
  name: string;
}

export const UNIT_TIERS: UnitTier[] = [
  { min: 0, stars: 1, name: '기본' },
  { min: 5, stars: 2, name: '숙련' },
  { min: 10, stars: 3, name: '영웅' },
];

/** 강화 레벨 → 진화 단계(0~2) */
export function unitTier(lv: number): number {
  let t = 0;
  UNIT_TIERS.forEach((u, i) => {
    if (lv >= u.min) t = i;
  });
  return t;
}

/** 다음 진화(없으면 null) */
export function nextUnitTier(lv: number): UnitTier | null {
  return UNIT_TIERS[unitTier(lv) + 1] ?? null;
}

/** ★ 표시(★★☆ 처럼) */
export function starText(lv: number): string {
  const s = UNIT_TIERS[unitTier(lv)].stars;
  return '★'.repeat(s) + '☆'.repeat(UNIT_TIERS.length - s);
}

/** 단계별 그림 키 */
export function tierKey(unit: string, legend: boolean, tier: number): string {
  const base = legend ? `${unit}@legend` : unit;
  return tier <= 0 ? base : `${base}_t${tier + 1}`;
}

/** 지금 레벨에서 쓸 그림 — 그 단계 그림이 없으면 아래 단계로, 전설 그림이 하나도 없으면 null */
export function evolvedKey(unit: string, lv: number, legend: boolean, has: (key: string) => boolean): string | null {
  for (let t = unitTier(lv); t >= 0; t--) {
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
export function unitPreloadKeys(units: string[], inManifest: (key: string) => boolean, levelOf: (unit: string) => number, equipped: (unit: string) => string | null): Set<string> {
  const out = new Set<string>();
  for (const u of units) {
    const lv = levelOf(u);
    out.add(u);
    const k = evolvedKey(u, lv, false, inManifest);
    if (k) out.add(k);
    if (equipped(u) === 'legend') {
      const l = evolvedKey(u, lv, true, inManifest);
      if (l) out.add(l);
    }
  }
  return out;
}
