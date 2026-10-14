/**
 * 🤝 유닛 조합 보너스 — 필요한 유닛이 전장에 모두 있으면 발동(순수 로직, Vitest 검증).
 * atk: 대상 유닛 공격력 배율 / guard: 대상 유닛이 받는 피해 배율 / heal: 치유량 배율 / speed: 공격 속도(쿨다운 배율)
 */
export interface Synergy {
  key: string;
  name: string;
  icon: string;
  need: string[]; // 전장에 모두 있어야 하는 유닛
  who: string[] | 'all'; // 효과 받는 유닛
  desc: string;
  atk?: number;
  guard?: number;
  heal?: number;
  speed?: number;
}

export const SYNERGIES: Synergy[] = [
  { key: 'wall', name: '철벽 수비', icon: '🛡️', need: ['knight', 'shield'], who: 'all', guard: 0.8, desc: '아군 받는 피해 -20%' },
  { key: 'holy', name: '성스러운 가호', icon: '✝️', need: ['knight', 'cleric'], who: ['cleric'], heal: 1.4, desc: '성직자 치유 +40%' },
  { key: 'arcane', name: '마도 연합', icon: '🔮', need: ['mage', 'darkmage'], who: ['mage', 'darkmage', 'earthmage'], atk: 1.25, desc: '마법사류 공격 +25%' },
  { key: 'volley', name: '궁창진', icon: '🏹', need: ['archer', 'spear'], who: ['archer', 'spear'], atk: 1.2, desc: '궁수·창병 공격 +20%' },
  { key: 'raid', name: '기동 타격대', icon: '🐎', need: ['cavalry', 'rogue'], who: ['cavalry', 'rogue'], speed: 0.8, desc: '기병·로그 공격 속도 +25%' },
  { key: 'siege', name: '포병 엄호', icon: '💣', need: ['cannon', 'shield'], who: ['cannon'], atk: 1.3, desc: '대포병 공격 +30%' },
  { key: 'earth', name: '대지의 힘', icon: '🌿', need: ['earthmage', 'soldier'], who: ['soldier', 'earthmage'], atk: 1.15, desc: '병사·흙마법사 공격 +15%' },
];

/** 지금 전장의 유닛 종류로 발동 중인 조합 */
export function activeSynergies(fieldTypes: Iterable<string>): Synergy[] {
  const have = new Set(fieldTypes);
  return SYNERGIES.filter((s) => s.need.every((n) => have.has(n)));
}

const applies = (s: Synergy, type: string): boolean => s.who === 'all' || s.who.includes(type);

/** 발동 중인 조합들에서 해당 유닛이 받는 배율(곱) */
export function synergyMult(active: Synergy[], type: string, stat: 'atk' | 'guard' | 'heal' | 'speed'): number {
  let m = 1;
  for (const s of active) if (s[stat] !== undefined && applies(s, type)) m *= s[stat]!;
  return m;
}
