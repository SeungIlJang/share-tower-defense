/**
 * 🎓 첫 경험 — 기능을 관문마다 하나씩 해금 + 처음 쓸 때 👆 손가락 안내. 순수 로직(Vitest 검증). 계획: docs/hit-plan.md A
 * 처음 하는 사람은 1관문에서 '소환'만 보고, 관문을 깰 때마다 새 기능이 하나씩 열림.
 * 이미 더 멀리 간 사람(clearedMax)·무한 모드는 전부 열림.
 */

export type Feature = 'heroSkill' | 'weapon' | 'prepare' | 'volley' | 'levelup' | 'perfect';

export interface FeatureDef {
  key: Feature;
  stage: number; // 이 관문부터
  name: string; // 결과 화면 '다음 관문에서 해금' 안내
}

export const FEATURES: FeatureDef[] = [
  { key: 'heroSkill', stage: 2, name: '👑 영웅 스킬' },
  { key: 'weapon', stage: 3, name: '🔥 특수 무기' },
  { key: 'prepare', stage: 3, name: '⚔️ 출전 준비(적 미리보기·덱)' },
  { key: 'volley', stage: 4, name: '🏰 성 특수 공격' },
  { key: 'levelup', stage: 5, name: '🃏 레벨업 카드' },
  { key: 'perfect', stage: 6, name: '⏱️ PERFECT 소환' },
];

/** 지금까지 도달한 관문(이번 관문과 '다음에 열린 관문' 중 큰 쪽) */
export function reachedStage(stageId: number, clearedMax: number): number {
  return Math.max(stageId, clearedMax + 1);
}

/** 이 기능을 쓸 수 있나 */
export function featureOn(f: Feature, reached: number, endless = false): boolean {
  return endless || reached >= (FEATURES.find((x) => x.key === f)?.stage ?? 1);
}

/** 관문 id를 깨면 새로 열리는 기능(결과 화면용) — 처음 깰 때만 */
export function unlockedBy(stageId: number, prevClearedMax: number): FeatureDef | null {
  if (stageId <= prevClearedMax) return null;
  return FEATURES.find((x) => x.stage === stageId + 1) ?? null;
}

/** 👆 안내 단계 — 순서대로 하나씩, 조건이 맞을 때 보여 주고 그 행동을 하면 끝 */
export type TipKey = 'summon' | 'hero' | 'mace' | 'weapon' | 'volley' | 'levelup' | 'perfect';

export const TIP_TEXT: Record<TipKey, string> = {
  summon: '👆 카드를 눌러 아군을 소환하세요!',
  hero: '👆 전장을 좌우로 밀면 👑영웅이 움직여요\n⭕ 노란 원 안의 아군이 강해져요',
  mace: '👆 영웅 스킬! 철퇴를 던져요 (💧마나 사용)',
  weapon: '👆 게이지가 찼어요! 특수 무기 발사!',
  volley: '👆 우리 성을 눌러 성 특수 공격!',
  levelup: '🃏 카드 1장을 골라 이번 판에서 강해져요!',
  perfect: '⏱️ 화살표가 초록에 있을 때 소환 = PERFECT 강화!',
};

/** 이 안내가 필요한 기능(없으면 항상) */
export const TIP_FEATURE: Partial<Record<TipKey, Feature>> = {
  mace: 'heroSkill',
  weapon: 'weapon',
  volley: 'volley',
  levelup: 'levelup',
  perfect: 'perfect',
};

/** 영웅 안내는 2관문부터(1관문은 소환에만 집중) */
export const HERO_TIP_STAGE = 2;

/** 지금 보여 줄 안내 — 아직 안 본 것 중 조건이 맞는 첫 번째 */
export function nextTip(
  seen: readonly string[],
  ready: Partial<Record<TipKey, boolean>>
): TipKey | null {
  const order: TipKey[] = ['summon', 'hero', 'mace', 'weapon', 'volley', 'perfect'];
  return order.find((k) => !seen.includes(k) && ready[k]) ?? null;
}

/** 🐣 처음 관문 쉽게 — 적 수 배율(1관문은 보스 없음, 2관문 보스 1마리) */
export const EASY_STAGE: Record<number, number> = { 1: 0.6, 2: 0.75, 3: 0.85 };
