/**
 * 🛡️ 영웅 장비 — 무기 1칸(🔨 J 스킬이 바뀜) + 반지 1칸(패시브), 등급 1~5. 순수 로직(Vitest 검증).
 * 그림: public/sprites/equip_weapon_icons · equip_ring_icons(프레임 = 아래 순서). 프롬프트: docs/equip-totem-prompts.md
 * 얻는 법: 🎁 보물 상자(등급이 높을수록 잘 나옴) — 이미 있으면 등급 +1, 강화 화면에서 골드로도 등급 올림.
 */

export const EQUIP_MAX = 5;
export const GRADE_COLORS = [0x8a92a8, 0x5cd88a, 0x4a9eff, 0xb07aff, 0xffc93a]; // 등급 1~5 테두리(회색·초록·파랑·보라·금)
export const GRADE_NAMES = ['일반', '고급', '희귀', '영웅', '전설'];

export type WeaponKey = 'mace' | 'frost_mace' | 'thunder_hammer' | 'flame_mace' | 'healing_scepter' | 'golden_mace';
export type RingKey = 'ring_exp' | 'ring_gold' | 'ring_mana' | 'ring_life' | 'ring_wind' | 'ring_luck';

export interface EquipDef {
  key: string;
  name: string;
  desc: (g: number) => string; // 등급별 설명
  frame: number; // 아이콘 시트 프레임
}

export const HERO_WEAPONS: (EquipDef & { key: WeaponKey })[] = [
  { key: 'mace', name: '철퇴', frame: 0, desc: (g) => `앞쪽 적 2명 관통 · 피해 ${pctOf(weaponPower(g))}` },
  { key: 'frost_mace', name: '서리 철퇴', frame: 1, desc: (g) => `맞은 적 ${frostSec(g)}초 느려짐` },
  { key: 'thunder_hammer', name: '번개 망치', frame: 2, desc: (g) => `번개가 옆 적 ${chainCount(g)}명에게 튐` },
  { key: 'flame_mace', name: '화염 메이스', frame: 3, desc: (g) => `떨어진 자리 3초 불바다(초당 ${Math.round(burnMult(g) * 100)}%)` },
  { key: 'healing_scepter', name: '치유의 홀', frame: 4, desc: (g) => `오라 안 아군 체력 ${Math.round(scepterHeal(g) * 100)}% 회복` },
  { key: 'golden_mace', name: '황금 철퇴', frame: 5, desc: (g) => `철퇴로 처치하면 골드 ×${goldMaceMult(g)}` },
];

export const RINGS: (EquipDef & { key: RingKey })[] = [
  { key: 'ring_exp', name: '경험의 반지', frame: 0, desc: (g) => `전투 경험치 +${ringPct('ring_exp', g)}%` },
  { key: 'ring_gold', name: '황금의 반지', frame: 1, desc: (g) => `처치 골드 +${ringPct('ring_gold', g)}%` },
  { key: 'ring_mana', name: '마나의 반지', frame: 2, desc: (g) => `💧 마나 충전 +${ringPct('ring_mana', g)}%` },
  { key: 'ring_life', name: '생명의 반지', frame: 3, desc: (g) => `👑 영웅 체력 +${ringPct('ring_life', g)}%` },
  { key: 'ring_wind', name: '바람의 반지', frame: 4, desc: (g) => `영웅 이동 속도 +${ringPct('ring_wind', g)}%` },
  { key: 'ring_luck', name: '행운의 반지', frame: 5, desc: (g) => `치명타 +${ringPct('ring_luck', g)}% · 상자 등급업 ${ringPct('ring_luck', g) * 2}%` },
];

const pctOf = (m: number): string => `×${m.toFixed(2)}`;

/** 무기 등급 → 철퇴 피해 배수 */
export function weaponPower(g: number): number {
  return 1 + 0.15 * (Math.max(1, g) - 1);
}
export function frostSec(g: number): number {
  return Math.round((1.5 + 0.3 * g) * 10) / 10;
}
export function chainCount(g: number): number {
  return 2 + Math.floor(g / 2);
}
export function burnMult(g: number): number {
  return 0.25 + 0.05 * g;
}
export function scepterHeal(g: number): number {
  return 0.08 + 0.02 * g;
}
export function goldMaceMult(g: number): number {
  return 1.5 + 0.25 * g;
}

/** 반지 등급 → 효과(%) — 경험·골드·이동 5%씩, 마나·체력 6%씩, 행운 2%씩 */
export function ringPct(k: RingKey, g: number): number {
  if (g <= 0) return 0;
  const per: Record<RingKey, number> = { ring_exp: 5, ring_gold: 5, ring_mana: 6, ring_life: 6, ring_wind: 5, ring_luck: 2 };
  return per[k] * g;
}

/** 반지 배수(장착 안 했거나 다른 반지면 1) */
export function ringMult(equipped: string | null, grade: number, k: RingKey): number {
  return equipped === k ? 1 + ringPct(k, grade) / 100 : 1;
}

/** 골드로 다음 등급 올리기 비용(최고면 null) */
export function equipUpCost(g: number): number | null {
  return g >= EQUIP_MAX ? null : 300 * g * g;
}

/** 🎁 상자에서 장비가 나올 확률(나무·은·금·전설) */
export const EQUIP_DROP = [0.1, 0.25, 0.5, 1];

/** 상자 장비 뽑기 — 기본 철퇴 제외 11종 중 하나 */
export function rollEquip(tier: number, rng: () => number): string | null {
  if (rng() >= (EQUIP_DROP[tier] ?? 0)) return null;
  const pool = [...HERO_WEAPONS.filter((w) => w.key !== 'mace').map((w) => w.key), ...RINGS.map((r) => r.key)];
  return pool[Math.floor(rng() * pool.length) % pool.length];
}

export function isWeapon(k: string): k is WeaponKey {
  return HERO_WEAPONS.some((w) => w.key === k);
}

export function equipDef(k: string): (EquipDef & { kind: 'weapon' | 'ring' }) | null {
  const w = HERO_WEAPONS.find((x) => x.key === k);
  if (w) return { ...w, kind: 'weapon' };
  const r = RINGS.find((x) => x.key === k);
  return r ? { ...r, kind: 'ring' } : null;
}
