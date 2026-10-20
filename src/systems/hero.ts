/** 👑 영웅 + 오라 + 영웅 스킬 — 순수 계산(Vitest 검증). 설계: docs/hero-design.md */
import type { UnitStats } from '../types';

export const HERO_TYPE = 'hero';
/** 영웅 그림 — 지금은 성기사(기사 전설 스킨) 그림을 임시로 사용 */
export const HERO_LOOKS = ['knight@legend', 'knight'];

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
  mana: number;
  cooldown: number; // 초
  hotkey: string;
}

/** 영웅 스킬(지금은 1종 — 이후 📯 돌격 함성 · ✨ 성스러운 빛 추가 예정) */
export const HERO_SKILLS: HeroSkill[] = [{ key: 'mace', icon: '🔨', name: '철퇴 던지기', mana: 10, cooldown: 1, hotkey: 'J' }];

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
