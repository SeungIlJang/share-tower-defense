/** 👑 영웅 + 오라 + 영웅 스킬 — 순수 계산(Vitest 검증). 설계: docs/hero-design.md */
import type { UnitStats } from '../types';

export const HERO_TYPE = 'hero';
/** 👑 영웅 진화 5단계 — 영웅 레벨(강화 화면)에 따라 그림이 바뀜 */
export interface HeroTier {
  min: number; // 이 레벨부터
  look: string; // 스프라이트 키(public/sprites/hero_N)
  name: string;
}
export const HERO_TIERS: HeroTier[] = [
  { min: 0, look: 'hero_1', name: '견습 기사' },
  { min: 5, look: 'hero_2', name: '기사' },
  { min: 10, look: 'hero_3', name: '성기사' },
  { min: 15, look: 'hero_4', name: '성전사 군주' },
  { min: 20, look: 'hero_5', name: '천상 기사' },
];
/** 그림이 없을 때 대신 쓸 그림 */
export const HERO_FALLBACK_LOOKS = ['knight@legend', 'knight'];

/** 영웅 레벨 → 진화 단계(0~4) */
export function heroTier(lv: number): number {
  let t = 0;
  HERO_TIERS.forEach((h, i) => {
    if (lv >= h.min) t = i;
  });
  return t;
}

/** 다음 진화(없으면 null) */
export function nextHeroTier(lv: number): HeroTier | null {
  return HERO_TIERS[heroTier(lv) + 1] ?? null;
}

/** 단계가 오를수록 몸집도 조금씩 커짐 */
export function heroBodyScale(tier: number): number {
  return 1.15 + 0.05 * tier;
}

/** 영웅 능력치 — 스테이지·적 배율에 맞춰 성장(늦은 스테이지에서도 버티게) */
export function heroStats(stageId: number, enemyMult = 1): UnitStats {
  const g = (1 + 0.08 * Math.max(0, stageId - 1)) * enemyMult;
  return {
    name: '영웅',
    hp: Math.round(1100 * g), // 쓰러지면 패배라 튼튼하게
    atk: Math.round(30 * g),
    def: Math.round(8 * g),
    atkSpeed: 1.1,
    range: 50,
    speed: 110,
    cost: 0,
    pop: 0,
  };
}

/** 초당 체력 자연 회복(최대 체력 비율) */
export const HERO_REGEN = 0.006;

// ⭕ 오라
export const AURA_RADIUS = 150;
export const AURA_ATK = 1.15; // 오라 안 아군 공격력 +15%
export const AURA_GUARD = 0.9; // 오라 안 아군 받는 피해 -10%

/** 오라 안인가 */
export function inAura(x: number, heroX: number, radius = AURA_RADIUS): boolean {
  return Math.abs(x - heroX) <= radius;
}

/** 목표 x로 한 걸음(넘어가지 않게) + 이동 가능 범위 제한 */
export function stepToward(x: number, target: number, speed: number, dt: number, min: number, max: number): number {
  const t = Math.min(max, Math.max(min, target));
  const d = t - x;
  const step = speed * dt;
  return Math.abs(d) <= step ? t : x + Math.sign(d) * step;
}

// 💧 마나(영웅 스킬 전용 — 유닛 소환 ⚡에너지와 별개)
export const MANA_MAX = 100;
export const MANA_REGEN = 6; // 초당
export const MANA_START = 30;

export interface HeroSkill {
  key: string;
  icon: string;
  name: string;
  desc: string;
  mana: number;
  cooldown: number; // 초
  hotkey: string;
  price: number; // 강화 화면 해금 가격(0 = 기본)
}

/** 영웅 스킬 3종 — 철퇴는 기본, 나머지는 강화 화면 👑 탭에서 해금 */
export const HERO_SKILLS: HeroSkill[] = [
  { key: 'mace', icon: '🔨', name: '철퇴 던지기', desc: '앞쪽 적 2명 관통', mana: 10, cooldown: 1, hotkey: 'J', price: 0 },
  { key: 'rally', icon: '📯', name: '돌격 함성', desc: '5초간 오라 안 공격 속도 +40%', mana: 35, cooldown: 8, hotkey: 'K', price: 800 },
  { key: 'holy', icon: '✨', name: '성스러운 빛', desc: '오라 안 아군 체력 35% 회복 + 적 밀쳐내기', mana: 50, cooldown: 15, hotkey: 'L', price: 1500 },
];

/** 📯 돌격 함성 · ✨ 성스러운 빛 수치 */
export const RALLY_SEC = 5;
export const RALLY_SPEED = 1.4; // 공격 속도 배수
export const HOLY_HEAL = 0.35; // 오라 안 아군 최대 체력 비율
export const HOLY_HERO_HEAL = 0.15; // 영웅 자신
export const HOLY_PUSH = 70;

// 👑 영구 강화(강화 화면 영웅 탭)
export const HERO_MAX_LV = 20;
export const AURA_MAX_LV = 5;
export const SKILL_MAX_LV = 5;

/** 영웅 레벨 → 체력·공격력 배수 */
export function heroLvMult(lv: number): number {
  return 1 + 0.12 * lv;
}

/** 오라 크기 강화 → 반지름 추가 */
export function auraBonus(lv: number): number {
  return 15 * lv;
}

/** 영웅 스킬 강화 → 위력(피해·지속·회복) 배수 */
export function heroSkillPower(lv: number): number {
  return 1 + 0.15 * lv;
}

/** 영웅 강화 비용 */
export function heroUpCost(kind: 'hero' | 'aura' | 'skill', lv: number): number {
  if (kind === 'hero') return 200 + 150 * lv;
  if (kind === 'aura') return 300 + 200 * lv;
  return 250 + 200 * lv;
}

/** ⚖️ 영웅이 생긴 만큼 적 체력 상향 */
export const HERO_ENEMY_HP = 1.15;

/** 오라 반지름 = 기본 + 영구 강화 + 레벨업 '오라 확장'(+ 각성 거대 오라) */
export function auraRadius(permLv: number, cardLv: number, awakened: boolean): number {
  return AURA_RADIUS + auraBonus(permLv) + 25 * cardLv + (awakened ? 100 : 0);
}

/** 🔨 철퇴 던지기 — 사거리 · 관통 수 · 피해 배율(영웅 공격력 기준) */
export const MACE_RANGE = 320;
export const MACE_PIERCE = 2;
export const MACE_MULT = 1.8;

/** 철퇴가 맞힐 적 — 영웅 앞쪽 사거리 안에서 가까운 순서로 최대 n명 */
export function maceTargets<T extends { x: number; active: boolean }>(heroX: number, enemies: T[], range = MACE_RANGE, n = MACE_PIERCE): T[] {
  return enemies
    .filter((e) => e.active && e.x >= heroX - 20 && e.x - heroX <= range)
    .sort((a, b) => a.x - b.x)
    .slice(0, n);
}
