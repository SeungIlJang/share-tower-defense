/** 레벨업 스킬(로그라이트, 한 판 단위) — 순수 로직 */

export type Grade = 'common' | 'rare' | 'legend';

export interface SkillDef {
  key: string;
  icon: string;
  name: string;
  desc: string; // 쉬운 설명(줄바꿈 \n)
  grade: Grade;
  /** 레벨 lv일 때 수치(카드에 '지금 → 다음'으로 표시). 즉시 효과는 없음 */
  value?: (lv: number) => string;
  max: number; // Infinity = 레벨업마다 계속 선택 가능
  instant?: boolean; // 고르는 순간 1회 효과(쌓이지 않음)
  awaken?: { name: string; desc: string }; // MAX 달성 시 각성 효과
}

/** 등급별 등장 가중치(%) · 카드 색 · 이름 */
export const GRADES: Record<Grade, { weight: number; color: number; edge: number; label: string }> = {
  common: { weight: 60, color: 0x1f4a7a, edge: 0x6ab8ff, label: '일반' },
  rare: { weight: 30, color: 0x4a2a7a, edge: 0xc08aff, label: '희귀' },
  legend: { weight: 10, color: 0x7a5410, edge: 0xffd34d, label: '전설' },
};

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const lines = (...l: string[]): string => l.join('\n');

export const SKILLS: SkillDef[] = [
  // 일반
  { key: 'supply', icon: '🍖', name: '인구 증가', grade: 'common', desc: lines('한 번에 더 많은 유닛을', '전장에 내보낼 수 있어요'), value: (lv) => `최대 인구 +${supplyBonus(lv)}`, max: Infinity },
  { key: 'mimic', icon: '📚', name: '경험치 보너스', grade: 'common', desc: lines('적을 잡으면 경험치를', '더 받아 레벨업이 빨라져요'), value: (lv) => `경험치 +${pct(mimicMult(lv) - 1)}`, max: 9 },
  { key: 'vigor', icon: '❤️', name: '튼튼한 몸', grade: 'common', desc: lines('새로 부르는 유닛의', '체력이 늘어나요'), value: (lv) => `체력 +${pct(vigorMult(lv) - 1)}`, max: 5, awaken: { name: '강철 피부', desc: '아군이 받는 피해 -15%' } },
  { key: 'recharge', icon: '🔋', name: '에너지 충전', grade: 'common', desc: lines('⚡에너지가 차는 속도가', '빨라져요'), value: (lv) => `충전 속도 +${pct(rechargeMult(lv) - 1)}`, max: 4, awaken: { name: '마력 폭주', desc: '에너지 최대치 +50' } },
  { key: 'energyNow', icon: '⚡', name: '에너지 가득', grade: 'common', desc: lines('지금 바로 ⚡에너지를', '가득 채워요'), max: Infinity, instant: true },
  // 희귀
  { key: 'haste', icon: '⚔️', name: '빠른 공격', grade: 'rare', desc: lines('우리 유닛 모두', '더 빨리 때려요'), value: (lv) => `공격 속도 +${pct(1 / hasteMult(lv) - 1)}`, max: 3, awaken: { name: '연속 공격', desc: '20% 확률로 곧바로 한 번 더 공격' } },
  { key: 'magic', icon: '💎', name: '소환 할인', grade: 'rare', desc: lines('유닛 부를 때 드는', '⚡에너지가 줄어요'), value: (lv) => `소환 비용 -${pct(1 - magicMult(lv))}`, max: 5, awaken: { name: '마나 순환', desc: '5번째 소환마다 공짜' } },
  { key: 'power', icon: '💪', name: '공격력 강화', grade: 'rare', desc: lines('우리 유닛 모두', '더 세게 때려요'), value: (lv) => `공격력 +${pct(powerMult(lv) - 1)}`, max: 5, awaken: { name: '일격필살', desc: '치명타 피해 1.5배 → 2.25배' } },
  { key: 'crit', icon: '🎯', name: '치명타', grade: 'rare', desc: lines('큰 피해를 주는', '치명타가 더 자주 터져요'), value: (lv) => `치명타 확률 ${pct(critChance(lv))}`, max: 4, awaken: { name: '연쇄 폭발', desc: '치명타 때 주변 적도 절반 피해' } },
  { key: 'repair', icon: '🔧', name: '기지 수리', grade: 'rare', desc: lines('우리 기지 체력을', '30% 바로 회복해요'), max: Infinity, instant: true },
  // 전설
  { key: 'charge', icon: '🔥', name: '무기 충전', grade: 'legend', desc: lines('특수 무기 게이지가', '더 빨리 차요'), value: (lv) => `충전 속도 +${pct(chargeMult(lv) - 1)}`, max: 3, awaken: { name: '무기 달인', desc: '발사 후 게이지 30% 남김' } },
  { key: 'freeSummon', icon: '🎁', name: '무료 소환', grade: 'legend', desc: lines('다음 3번 소환은', '⚡에너지 없이 공짜!'), max: Infinity, instant: true },
  // ⭕ 오라(👑 영웅 주변)
  { key: 'auraSize', icon: '⭕', name: '오라 확장', grade: 'common', desc: lines('영웅 주변 노란 원이', '더 넓어져요'), value: (lv) => `오라 반지름 +${25 * lv}`, max: 4, awaken: { name: '거대 오라', desc: '오라 반지름 +100 더' } },
  { key: 'auraGuard', icon: '🛡️', name: '수호 오라', grade: 'common', desc: lines('노란 원 안 아군이', '덜 아프게 맞아요'), value: (lv) => `오라 안 받는 피해 -${6 * lv}%`, max: 5, awaken: { name: '치유의 땅', desc: '오라 안 아군 초당 2% 회복' } },
  { key: 'prayer', icon: '🙏', name: '기도', grade: 'common', desc: lines('영웅 스킬에 쓰는', '💧마나가 빨리 차요'), value: (lv) => `마나 회복 +${20 * lv}%`, max: 5 },
  { key: 'auraBerserk', icon: '😡', name: '광폭 오라', grade: 'rare', desc: lines('원 안 유닛이 체력 30%', '아래면 크게 강해져요'), value: (lv) => `위기 때 공격력 +${40 * lv}%`, max: 2, awaken: { name: '최후의 발악', desc: '위기 때 공격 속도도 2배' } },
  { key: 'auraSkill', icon: '🌟', name: '기술 오라', grade: 'rare', desc: lines('원 안 유닛의 고유 스킬이', '더 자주 터져요'), value: (lv) => `스킬 주기 -${lv}타`, max: 3, awaken: { name: '오라 공명', desc: '오라 안 스킬 피해 +50%' } },
];

export const SKILL_BY_KEY: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.key, s]));

/** 다음 레벨까지 필요 경험치 */
export function xpToNext(level: number): number {
  return Math.round(25 * Math.pow(1.35, level - 1));
}

/** 빠른 공격: 공격 쿨다운 배수(작을수록 빠름) */
export function hasteMult(lv: number): number {
  return Math.max(0.4, 1 - 0.08 * lv);
}

/** 경험치 보너스: 경험치 획득 배수 */
export function mimicMult(lv: number): number {
  return 1 + 0.15 * lv;
}

/** 소환 할인: 소환 에너지 배수(작을수록 저렴) */
export function magicMult(lv: number): number {
  return Math.max(0.5, 1 - 0.06 * lv);
}

/** 인구 증가: 최대 인구 추가량 */
export function supplyBonus(lv: number): number {
  return 5 * lv;
}

/** 튼튼한 몸: 새 유닛 체력 배수 */
export function vigorMult(lv: number): number {
  return 1 + 0.15 * lv;
}

/** 에너지 충전: 충전 속도 배수 */
export function rechargeMult(lv: number): number {
  return 1 + 0.15 * lv;
}

/** 공격력 강화: 아군 공격력 배수 */
export function powerMult(lv: number): number {
  return 1 + 0.1 * lv;
}

/** 치명타 확률(기본 10%) */
export function critChance(lv: number): number {
  return 0.1 + 0.05 * lv;
}

/** 무기 충전: 특수 무기 게이지 속도 배수 */
export function chargeMult(lv: number): number {
  return 1 + 0.25 * lv;
}

/** MAX 찍어 각성했나 */
export function awakened(levels: Record<string, number>, key: string): boolean {
  const s = SKILL_BY_KEY[key];
  return !!s?.awaken && (levels[key] ?? 0) >= s.max;
}

/** 아직 고를 수 있는 스킬 */
export function available(levels: Record<string, number>): SkillDef[] {
  return SKILLS.filter((s) => (levels[s.key] ?? 0) < s.max);
}

/** 더 올릴 수 있는 스킬이 하나라도 있나 */
export function anyUpgradable(levels: Record<string, number>): boolean {
  return available(levels).length > 0;
}

/** 🎲 레벨업 후보 n장 — 등급 가중치로 겹치지 않게 뽑기. rng는 0~1 */
export function rollChoices(levels: Record<string, number>, rng: () => number, n = 3): SkillDef[] {
  const pool = available(levels);
  const out: SkillDef[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((t, s) => t + GRADES[s.grade].weight, 0);
    let r = rng() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) {
      r -= GRADES[pool[i].grade].weight;
      if (r < 0) break;
    }
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}
