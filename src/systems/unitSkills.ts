/**
 * 유닛 고유 스킬(영구 강화 Lv1부터) — 순수 로직, Vitest 검증.
 * 일반 공격 N번마다 자동 발동. 레벨이 오르면 더 자주, 더 세게.
 */

export type SkillKind =
  | 'aoe' // 대상 주변 범위 피해
  | 'pierce' // 앞쪽 일직선 적 여러 마리
  | 'single' // 대상 하나에 큰 피해
  | 'heal' // 주변 아군 범위 치유(성직자)
  | 'guard' // 범위 피해 + 자기 피해 감소
  | 'slow' // 범위 피해 + 이동 느려짐
  | 'pull' // 범위 피해 + 한곳으로 끌어당김
  | 'push' // 피해 + 뒤로 밀어냄
  | 'dash'; // 앞으로 돌진하며 경로상 피해

export interface UnitSkill {
  name: string;
  kind: SkillKind;
  radius: number; // 범위(px) — pierce·dash는 앞쪽 길이
  color: number; // 그림 이펙트가 없을 때 대신 쓰는 원 색
}

export const UNIT_SKILLS: Record<string, UnitSkill> = {
  soldier: { name: '회전 베기', kind: 'aoe', radius: 70, color: 0x6ab8ff },
  archer: { name: '관통 화살', kind: 'pierce', radius: 220, color: 0x9aff5a },
  knight: { name: '철벽의 의지', kind: 'guard', radius: 55, color: 0x9ab4ff },
  mage: { name: '마력 폭발', kind: 'aoe', radius: 110, color: 0xd58cff },
  rogue: { name: '그림자 베기', kind: 'single', radius: 0, color: 0x9a5aff },
  cleric: { name: '치유의 빛', kind: 'heal', radius: 150, color: 0x5cff9e },
  earthmage: { name: '대지 가시', kind: 'slow', radius: 95, color: 0xd8903a },
  darkmage: { name: '블랙홀', kind: 'pull', radius: 105, color: 0x6a2aff },
  spear: { name: '연속 찌르기', kind: 'pierce', radius: 120, color: 0x4ad0e0 },
  shield: { name: '방패 강타', kind: 'push', radius: 50, color: 0xd8b04a },
  cavalry: { name: '돌진', kind: 'dash', radius: 140, color: 0xff6a4a },
  cannon: { name: '포격', kind: 'aoe', radius: 150, color: 0xffa94d },
};

/** 스킬 단일 피해 추가 배율(그림자 베기처럼 한 명만 노리는 스킬) */
export const SINGLE_BONUS = 1.6;
export const GUARD_SEC = 2; // 철벽의 의지: 자기 피해 50% 감소 시간
export const SLOW_SEC = 2; // 대지 가시: 이동 50%
export const PULL_PX = 45; // 블랙홀: 중심으로 끌어당기는 거리
export const PUSH_PX = 90; // 방패 강타: 밀어내는 거리
export const DASH_PX = 70; // 돌진: 기병이 앞으로 나가는 거리
export const PIERCE_MAX = 4; // 관통 최대 대상 수

/** 일반 공격 몇 번마다 스킬 발동(0레벨 = 스킬 없음) — Lv1: 5번, Lv2~3: 4번, Lv4+: 3번 */
export function skillEvery(lv: number): number {
  if (lv <= 0) return Infinity;
  if (lv >= 4) return 3;
  if (lv >= 2) return 4;
  return 5;
}

/** 스킬 위력 배율 = 1.5 + 0.2 × 레벨 */
export function skillMult(lv: number): number {
  return lv <= 0 ? 0 : 1.5 + 0.2 * lv;
}

/** 이번 공격이 스킬인가 — swings = 지금 공격을 포함한 누적 공격 수 */
export function isSkillSwing(swings: number, lv: number): boolean {
  const n = skillEvery(lv);
  return Number.isFinite(n) && swings > 0 && swings % n === 0;
}
