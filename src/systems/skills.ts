/** 레벨업 스킬(로그라이트, 한 판 단위) — 순수 로직 */

export interface SkillDef {
  key: string;
  name: string;
  desc: string;
  max: number;
}

export const SKILLS: SkillDef[] = [
  { key: 'haste', name: '신속 오라', desc: '아군 공격 간격 단축', max: 3 },
  { key: 'mimic', name: '미믹', desc: '획득 경험치 증가', max: 9 },
  { key: 'magic', name: '마법 숙련', desc: '소환 에너지 소모 감소', max: 5 },
  { key: 'supply', name: '보급', desc: '최대 인구 +5', max: 4 },
];

/** 다음 레벨까지 필요 경험치 */
export function xpToNext(level: number): number {
  return Math.round(25 * Math.pow(1.35, level - 1));
}

/** 신속오라: 공격 쿨다운 배수(작을수록 빠름) */
export function hasteMult(lv: number): number {
  return Math.max(0.4, 1 - 0.08 * lv);
}

/** 미믹: 경험치 획득 배수 */
export function mimicMult(lv: number): number {
  return 1 + 0.15 * lv;
}

/** 마법숙련: 소환 에너지 배수(작을수록 저렴) */
export function magicMult(lv: number): number {
  return Math.max(0.5, 1 - 0.06 * lv);
}

/** 보급: 최대 인구 추가량 */
export function supplyBonus(lv: number): number {
  return 5 * lv;
}

/** 더 올릴 수 있는 스킬이 하나라도 있나 */
export function anyUpgradable(levels: Record<string, number>): boolean {
  return SKILLS.some((s) => (levels[s.key] ?? 0) < s.max);
}
