import { tr } from './i18n';
/**
 * 🎓 첫 경험 — 기능을 관문마다 하나씩 해금 + 처음 쓸 때 👆 손가락 안내. 순수 로직(Vitest 검증). 계획: docs/hit-plan.md A
 * 처음 하는 사람도 1관문부터 소환 + 🔥 특수 무기(장난감 먼저) — 관문을 깰 때마다 새 기능이 열림.
 * 재미있는 기능이 이탈 지점(3관문) 뒤에 있던 것을 앞으로 당김: 무기 3→1 · 카드 5→2 · 성 공격 4→3 · PERFECT 6→4.
 * 이미 더 멀리 간 사람(clearedMax)·무한 모드는 전부 열림.
 */

export type Feature = 'heroSkill' | 'weapon' | 'prepare' | 'volley' | 'levelup' | 'perfect' | 'command' | 'duel';

export interface FeatureDef {
  key: Feature;
  stage: number; // 이 관문부터
  name: string; // 결과 화면 '다음 관문에서 해금' 안내
}

export const FEATURES: FeatureDef[] = [
  { key: 'weapon', stage: 1, name: tr('🔥 특수 무기') },
  { key: 'heroSkill', stage: 2, name: tr('👑 영웅 스킬') },
  { key: 'prepare', stage: 1, name: tr('⚔️ 출전 준비(적 미리보기·덱)') }, // 1관문부터 — 나오는 적을 먼저 보고 시작
  { key: 'volley', stage: 3, name: tr('🏰 성 특수 공격') },
  { key: 'levelup', stage: 2, name: tr('🃏 레벨업 카드') },
  { key: 'perfect', stage: 4, name: tr('⏱️ PERFECT 소환') },
  { key: 'command', stage: 5, name: tr('🚩 부대 명령(버티기 → 돌격)') },
  { key: 'duel', stage: 9, name: tr('⚔️ 일기토(적장과 1:1 결투)') },
];

/** 지금까지 도달한 관문(이번 관문과 '다음에 열린 관문' 중 큰 쪽) */
export function reachedStage(stageId: number, clearedMax: number): number {
  return Math.max(stageId, clearedMax + 1);
}

/** 이 기능을 쓸 수 있나 */
export function featureOn(f: Feature, reached: number, endless = false): boolean {
  return endless || reached >= (FEATURES.find((x) => x.key === f)?.stage ?? 1);
}

/** 관문 id를 깨면 새로 열리는 기능들(결과 화면용) — 처음 깰 때만 */
export function unlockedBy(stageId: number, prevClearedMax: number): FeatureDef[] {
  if (stageId <= prevClearedMax) return [];
  return FEATURES.filter((x) => x.stage === stageId + 1);
}

/** 👆 안내 단계 — 순서대로 하나씩, 조건이 맞을 때 보여 주고 그 행동을 하면 끝 */
export type TipKey = 'summon' | 'hero' | 'upgrade' | 'mace' | 'weapon' | 'volley' | 'levelup' | 'perfect' | 'command';

export const TIP_TEXT: Record<TipKey, string> = {
  summon: tr('👆 카드를 눌러 아군을 소환하세요!'),
  hero: tr('👆 전장을 좌우로 밀면 👑영웅이 움직여요\n⭕ 노란 원 안의 아군이 강해져요'),
  upgrade: tr('🪙 적을 잡아 모은 전투 골드로 유닛 강화!\n⬆ 누를 때마다 체력·공격 +20% (이번 판만)'),
  mace: tr('👆 영웅 스킬! 철퇴를 던져요 (💧마나 사용)'),
  weapon: tr('👆 게이지가 찼어요! 특수 무기 발사!'),
  volley: tr('👆 우리 성을 눌러 성 특수 공격!'),
  levelup: tr('🃏 카드 1장을 골라 이번 판에서 강해져요!'),
  perfect: tr('⏱️ 화살표가 초록에 있을 때 소환 = PERFECT 강화!'),
  command: tr('🚩 버티기로 아군을 모았다가\n⚔️ 돌격으로 한 번에 밀어붙여요!'),
};

/** 이 안내가 필요한 기능(없으면 항상) */
export const TIP_FEATURE: Partial<Record<TipKey, Feature>> = {
  mace: 'heroSkill',
  weapon: 'weapon',
  volley: 'volley',
  levelup: 'levelup',
  perfect: 'perfect',
  command: 'command',
};

/** 영웅 안내는 2관문부터(1관문은 소환에만 집중) */
export const HERO_TIP_STAGE = 2;

/** 지금 보여 줄 안내 — 아직 안 본 것 중 조건이 맞는 첫 번째 */
export function nextTip(
  seen: readonly string[],
  ready: Partial<Record<TipKey, boolean>>
): TipKey | null {
  const order: TipKey[] = ['summon', 'hero', 'upgrade', 'mace', 'weapon', 'volley', 'perfect', 'command'];
  return order.find((k) => !seen.includes(k) && ready[k]) ?? null;
}

/** 🐣 처음 관문 — 적 수 배율(1관문은 보스 없음, 2~3관문 보스 1마리). 약한 적이 떼로 나오게 수는 늘림(세기는 density.earlyTune) */
export const EASY_STAGE: Record<number, number> = { 1: 1.2, 2: 1.3, 3: 1.4 };
