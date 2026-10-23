/**
 * 🗿 설치물 카드 — 덱에 넣고 ⚡로 설치. 영웅 앞에 서서 60초 동안 싸우고 사라짐(움직이지 않음). 순수 데이터(Vitest 검증).
 * 그림: public/sprites/totem_* (등장 skill · 대기 idle · 공격 attack · 사라짐 death). 프롬프트: docs/equip-totem-prompts.md
 */
export type TotemKind = 'shooter' | 'burn' | 'heal';

export const TOTEMS: Record<string, { kind: TotemKind; desc: string }> = {
  totem_egg: { kind: 'shooter', desc: '🐔 앞쪽 적에게 알을 쏨' },
  totem_fire: { kind: 'burn', desc: '🔥 주변 적에게 1초마다 불 피해' },
  totem_heal: { kind: 'heal', desc: '🌿 주변 아군을 1초마다 회복' },
};

export const TOTEM_LIFE = 60; // 초
export const TOTEM_AHEAD = 40; // 영웅 앞 이만큼에 설치

export function isTotem(type: string): boolean {
  return type in TOTEMS;
}

/** 설치 위치 — 영웅 앞(영웅이 없으면 성 앞), 적 성 근처까지는 못 감 */
export function totemX(heroX: number | null, minX: number, maxX: number): number {
  return Math.min(maxX, Math.max(minX, (heroX ?? minX) + TOTEM_AHEAD));
}

/** 회복 토템 1번 회복량 — 공격력 기준 */
export function totemHeal(atk: number): number {
  return Math.round(atk * 1.5);
}
