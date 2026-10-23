/**
 * 💫 넉다운 — 무거운 공격은 확률로 상대를 뒤로 튕기고 잠깐 멈추게 함. 순수 로직(Vitest 검증). 분석: docs/paladog-apk-analysis.md ⑥
 * 방패병·영웅·마차·보스·거대 적은 밀리지 않음, 중갑 적은 확률 절반.
 */
import { enemyKind } from './counters';
import { isBoss } from './bosses';

export const KNOCK_PX = 42; // 튕겨 나가는 거리
export const KNOCK_MS = 550; // 멈춤 시간

/** 일반 공격 넉다운 확률 — 아군은 유닛별, 적은 보스·거대·중갑 우두머리 */
const ALLY_KNOCK: Record<string, number> = { knight: 0.2, cavalry: 0.35, spear: 0.15, hero: 0.25 };
const ENEMY_KNOCK: Record<string, number> = { orc_warchief: 0.25, stone_golem: 0.2, lava_golem: 0.2, ice_golem: 0.2, king_slime: 0.25 };
const BOSS_KNOCK = 0.3;
const UNMOVABLE_ALLY = new Set(['shield', 'hero', 'wagon']);

export function knockChance(attacker: string, attackerSide: 'ally' | 'enemy', target: string): number {
  if (attackerSide === 'ally') {
    const c = ALLY_KNOCK[attacker] ?? 0;
    const k = enemyKind(target);
    if (!c || k === 'giant') return 0; // 보스·거대 적은 밀리지 않음
    return k === 'armored' ? c / 2 : c;
  }
  if (UNMOVABLE_ALLY.has(target)) return 0;
  return isBoss(attacker) ? BOSS_KNOCK : ENEMY_KNOCK[attacker] ?? 0;
}
