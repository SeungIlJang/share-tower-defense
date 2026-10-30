/**
 * ⚔️ 유닛 상성 — 적 6종류(빠른 적·비행·중갑·원거리·무리·거대), 유닛마다 강한 종류가 하나(피해 ×1.5).
 * 출전 덱 8칸 — 관문 미리보기에서 나오는 적을 보고 유닛을 고름. 순수 로직(Vitest 검증). 계획: docs/hit-plan.md B
 */
import type { StageData } from '../types';
import { bossForStage, isBoss } from './bosses';

export type EnemyKind = 'beast' | 'flying' | 'armored' | 'caster' | 'swarm' | 'giant';

export const KIND_INFO: Record<EnemyKind, { icon: string; name: string }> = {
  beast: { icon: '🐺', name: '빠른 적' },
  flying: { icon: '🦇', name: '비행' },
  armored: { icon: '🛡️', name: '중갑' },
  caster: { icon: '🏹', name: '원거리' },
  swarm: { icon: '🟢', name: '무리' },
  giant: { icon: '👹', name: '거대' },
};

/** 적 종류(보스는 모두 거대) */
const ENEMY_KIND: Record<string, EnemyKind> = {
  goblin: 'beast',
  goblin_bomber: 'beast',
  wolf: 'beast',
  dire_wolf: 'beast',
  frost_wolf: 'beast',
  orc_berserker: 'beast',
  bat: 'flying',
  vampire_bat: 'flying',
  ghost: 'flying',
  wisp: 'flying',
  banshee: 'flying',
  baby_dragon: 'flying',
  orc: 'armored',
  orc_shield: 'armored',
  orc_warchief: 'armored',
  skeleton: 'armored',
  skeleton_knight: 'armored',
  stone_golem: 'armored',
  lava_golem: 'armored',
  ice_golem: 'armored',
  goblin_archer: 'caster',
  goblin_shaman: 'caster',
  skeleton_archer: 'caster',
  necromancer: 'caster',
  slime: 'swarm',
  poison_slime: 'swarm',
  mushroom: 'swarm',
  toxic_mushroom: 'swarm',
  king_slime: 'giant',
};

/** 유닛이 강한 적 종류(방패병·성직자 = 보조라 없음) */
export const UNIT_COUNTER: Record<string, EnemyKind | null> = {
  soldier: 'beast',
  knight: 'beast',
  rogue: 'caster',
  cavalry: 'caster',
  archer: 'flying',
  mage: 'armored',
  earthmage: 'armored',
  darkmage: 'armored',
  spear: 'giant',
  cannon: 'swarm',
  shield: null,
  cleric: null,
  totem_egg: 'flying', // 🗿 설치물
  totem_fire: 'swarm',
  totem_heal: null,
};

export const COUNTER_MULT = 1.5;
export const DECK_SIZE = 10;

export function enemyKind(type: string): EnemyKind | null {
  return isBoss(type) ? 'giant' : ENEMY_KIND[type] ?? null;
}

/** 유닛 → 적 피해 배수(상성이면 ×1.5) */
export function counterMult(unit: string, enemy: string): number {
  const c = UNIT_COUNTER[unit];
  return c && c === enemyKind(enemy) ? COUNTER_MULT : 1;
}

/** 관문에 나오는 적(기본 적 기준) → 마릿수 — 관문 보스 먼저, 나머지는 많은 순 */
export function stageEnemies(stage: StageData): { type: string; count: number }[] {
  const m = new Map<string, number>();
  for (const w of stage.waves) for (const e of w.enemies) m.set(e.type, (m.get(e.type) ?? 0) + e.count);
  const main = bossForStage(stage.id);
  const rank = (t: string): number => (t === main ? 2 : isBoss(t) ? 1 : 0); // 관문 보스 → 다른 보스 → 많은 순
  return [...m.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => rank(b.type) - rank(a.type) || b.count - a.count);
}

/** 관문의 적 종류별 비중(마릿수 합) — 많은 순 */
export function stageKinds(stage: StageData): { kind: EnemyKind; count: number }[] {
  const m = new Map<EnemyKind, number>();
  for (const e of stageEnemies(stage)) {
    const k = enemyKind(e.type);
    if (k) m.set(k, (m.get(k) ?? 0) + e.count);
  }
  return [...m.entries()].map(([kind, count]) => ({ kind, count })).sort((a, b) => b.count - a.count);
}

/** 이 관문에 유리한 유닛(상성 적이 나옴) */
export function goodUnits(stage: StageData, units: string[]): string[] {
  const kinds = new Set(stageKinds(stage).map((k) => k.kind));
  return units.filter((u) => {
    const c = UNIT_COUNTER[u];
    return !!c && kinds.has(c);
  });
}

/** 출전 덱 정리 — 보유한 것만, 최대 8, 빈칸은 보유 유닛으로 채움(새로 산 유닛이 바로 나오게) */
export function normalizeDeck(deck: string[], owned: string[]): string[] {
  const d = [...new Set(deck)].filter((k) => owned.includes(k)).slice(0, DECK_SIZE);
  for (const k of owned) if (d.length < DECK_SIZE && !d.includes(k)) d.push(k);
  return d;
}
