/**
 * 👾 적 변종 — 기본 적이 나올 때 관문(무한 모드는 웨이브)이 높으면 일정 확률로 변종으로 바뀜.
 * 예) 2관문부터 고블린의 25%가 고블린 궁수. 순수 로직(Vitest 검증). 데이터: src/data/enemies.json
 * 전용 그림이 없으면 look(빌려 쓸 그림) + tint(색) + scale(크기)로 표시 — 그림이 생기면 자동으로 그 그림.
 */
import type { EnemyStats } from '../types';

export interface VariantRule {
  key: string;
  minStage: number;
  chance: number;
}

/** 기본 적 → 변종 목록 */
export function variantTable(enemies: Record<string, EnemyStats>): Record<string, VariantRule[]> {
  const t: Record<string, VariantRule[]> = {};
  for (const [key, e] of Object.entries(enemies)) {
    if (!e.variantOf) continue;
    (t[e.variantOf] ??= []).push({ key, minStage: e.minStage ?? 1, chance: e.chance ?? 0.1 });
  }
  return t;
}

/** 이번에 나올 적 — 조건에 맞는 변종을 차례로 굴려 처음 걸린 것, 없으면 원래 적 */
export function pickVariant(type: string, level: number, table: Record<string, VariantRule[]>, rng: () => number): string {
  for (const v of table[type] ?? []) {
    if (level >= v.minStage && rng() < v.chance) return v.key;
  }
  return type;
}

/** 변종이 나오는 '단계' — 관문 번호, 무한 모드는 웨이브+1(최대 20) */
export function enemyLevel(endless: boolean, stageId: number, wave: number): number {
  return endless ? Math.min(20, 1 + wave) : stageId;
}

/** '#ffa04a' → 0xffa04a (없으면 null) */
export function hexColor(s: string | undefined): number | null {
  return s ? parseInt(s.replace('#', ''), 16) : null;
}
