/**
 * 🏰 성 — 공격 · 강화(20레벨) · 단계별 형태 · 적 성 진화. 순수 계산(Vitest 검증). 설계: docs/castle-design.md
 */

export const CASTLE_MAX_LV = 20;
export const CASTLE_RATE_MAX_LV = 10;

export type CastleShot = 'arrow' | 'arrow2' | 'cannon' | 'chain' | 'beam' | 'rock' | 'poison' | 'fire' | 'dark' | 'curse';

export interface CastleTier {
  min: number; // 우리 성: 성 레벨 / 적 성: 관문
  name: string;
  shot: CastleShot;
}

/** 우리 성 5단계(성 레벨 0·5·10·15·20) */
export const ALLY_CASTLE_TIERS: CastleTier[] = [
  { min: 0, name: '돌 망루', shot: 'arrow' },
  { min: 5, name: '성벽 요새', shot: 'arrow2' },
  { min: 10, name: '성채', shot: 'cannon' },
  { min: 15, name: '왕성', shot: 'chain' },
  { min: 20, name: '천공의 성', shot: 'beam' },
];

/** 적 성 5단계(관문 1·5·9·13·17) */
export const ENEMY_CASTLE_TIERS: CastleTier[] = [
  { min: 1, name: '오크 가시 망루', shot: 'rock' },
  { min: 5, name: '해골 요새', shot: 'poison' },
  { min: 9, name: '용암 요새', shot: 'fire' },
  { min: 13, name: '암흑 성채', shot: 'dark' },
  { min: 17, name: '마왕성', shot: 'curse' },
];

function tierOf(tiers: CastleTier[], v: number): number {
  let t = 0;
  tiers.forEach((x, i) => {
    if (v >= x.min) t = i;
  });
  return t;
}

/** 우리 성 레벨 → 단계(0~4) */
export function allyCastleTier(lv: number): number {
  return tierOf(ALLY_CASTLE_TIERS, lv);
}

/** 적 성 단계 — 관문 번호 / 무한 모드는 웨이브 4·8·12·16마다 한 단계 */
export function enemyCastleTier(endless: boolean, stageId: number, wave: number): number {
  return endless ? Math.min(4, Math.floor(Math.max(0, wave) / 4)) : tierOf(ENEMY_CASTLE_TIERS, stageId);
}

/** 단계별 그림 키(★1 = 지금 그림) */
export function castleLook(side: 'ally' | 'enemy', tier: number): string {
  const base = side === 'ally' ? 'base_ally' : 'base_enemy';
  return tier <= 0 ? base : `${base}_t${tier + 1}`;
}

/** 성 체력 배수(우리 성) */
export function castleHpMult(lv: number): number {
  return 1 + 0.1 * lv;
}

export interface CastleGun {
  dmg: number;
  range: number;
  interval: number; // 초
}

/** 우리 성 공격력·사거리·간격 */
export function allyCastleGun(lv: number, rateLv: number): CastleGun {
  return {
    dmg: Math.round(30 * (1 + 0.12 * lv)),
    range: 460 + 10 * lv, // 전장 앞쪽 1/3을 지킴(최대 +200)
    interval: Math.round(1.2 * (1 - 0.06 * rateLv) * 100) / 100,
  };
}

/** 적 성 공격력·사거리·간격 — 우리 성보다 약하게, 관문 배율로 성장 */
export function enemyCastleGun(tier: number, enemyMult: number): CastleGun {
  return {
    dmg: Math.round(8 * (1 + 0.35 * tier) * enemyMult),
    range: 380 + 20 * tier,
    interval: 1.8,
  };
}

/** 성벽 궁수(발사 위치) 수 — 단계마다 늘어남(최대 4) */
export function castleArchers(tier: number): number {
  return Math.min(4, tier + 1);
}

// 🎯 성 특수 공격(우리 성을 탭) — 20초마다, 사거리 안 적 최대 8명에게 큰 피해
export const VOLLEY_CD = 20;
export const VOLLEY_MULT = 2.5;
export const VOLLEY_MAX = 8;
export const VOLLEY_NAMES = ['🏹 화살비', '🏹 화살 폭풍', '💣 일제 포격', '⚡ 번개 폭풍', '✨ 성광 기둥'];

/** 강화 비용 */
export function castleUpCost(kind: 'castle' | 'castleRate', lv: number): number {
  return kind === 'castle' ? 200 + 150 * lv : 250 + 180 * lv;
}

/** 사거리 안 가장 가까운 대상(성 앞쪽만) */
export function castleTarget<T extends { x: number; active: boolean }>(baseX: number, dir: 1 | -1, range: number, list: T[]): T | null {
  let best: T | null = null;
  let bd = Infinity;
  for (const o of list) {
    if (!o.active) continue;
    const d = (o.x - baseX) * dir;
    if (d < -20 || d > range) continue;
    if (d < bd) {
      bd = d;
      best = o;
    }
  }
  return best;
}
