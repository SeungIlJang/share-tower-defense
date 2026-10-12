/**
 * 전투 계산 (순수 로직 — 렌더링과 분리, Vitest로 검증)
 */

/** 데미지 공식: 공격력에서 방어력 절반을 차감, 최소 1 보장 */
export function computeDamage(atk: number, def: number): number {
  return Math.max(1, Math.round(atk - def * 0.5));
}

/** 피해 적용 후 남은 HP (0 미만 방지) */
export function applyDamage(hp: number, dmg: number): number {
  return Math.max(0, hp - dmg);
}

export function isDead(hp: number): boolean {
  return hp <= 0;
}

/** 공격 쿨다운(초) = 1 / 초당공격수 */
export function attackCooldown(atkSpeed: number): number {
  return atkSpeed > 0 ? 1 / atkSpeed : Infinity;
}

/** 두 지점이 사거리 안에 있는지 */
export function inRange(ax: number, bx: number, range: number): boolean {
  return Math.abs(ax - bx) <= range;
}
