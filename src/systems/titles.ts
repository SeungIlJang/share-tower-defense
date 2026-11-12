import { tr } from './i18n';
/**
 * 🏷️ 칭호 — 월드를 깨거나 기록을 세우면 얻고, 메인 화면에 달고 다님. 순수 로직(Vitest 검증).
 */
export interface TitleCtx {
  clearedMax: number;
  endlessBest: number;
  codexFound: number;
  chestsOpened: number;
  totalStars: number;
  weeklyBest: number; // 주간 보스 최고 단계(0~5)
}

export interface TitleDef {
  key: string;
  name: string;
  how: string; // 얻는 법
  has: (c: TitleCtx) => boolean;
}

const WORLD_TITLES = [tr('🌳 숲의 수호자'), tr('🏜️ 사막의 방랑자'), tr('❄️ 설원의 용사'), tr('🌿 늪지 정화자'), tr('🌋 화산 정복자'), tr('🪦 망자의 안식자'), tr('💎 수정 탐험가'), tr('☁️ 하늘의 기사'), tr('🌑 그림자 사냥꾼'), tr('👑 마왕을 물리친 영웅')];

export const TITLES: TitleDef[] = [
  ...WORLD_TITLES.map((name, i) => ({ key: `world${i + 1}`, name, how: tr('월드 {0} 보스(관문 {1}) 처치', i + 1, (i + 1) * 10), has: (c: TitleCtx) => c.clearedMax >= (i + 1) * 10 })),
  { key: 'endless20', name: tr('♾️ 끝없는 전사'), how: tr('무한 모드 웨이브 20'), has: (c) => c.endlessBest >= 20 },
  { key: 'codex40', name: tr('📖 몬스터 박사'), how: tr('도감 40종 발견'), has: (c) => c.codexFound >= 40 },
  { key: 'chest50', name: tr('🎁 보물 사냥꾼'), how: tr('보물 상자 50개 열기'), has: (c) => c.chestsOpened >= 50 },
  { key: 'stars150', name: tr('⭐ 별을 모으는 자'), how: tr('별 150개 모으기'), has: (c) => c.totalStars >= 150 },
  { key: 'weekly5', name: tr('🗡️ 주간 보스 사냥꾼'), how: tr('주간 보스 5단계 달성'), has: (c) => c.weeklyBest >= 5 },
];

export function earnedTitles(c: TitleCtx): string[] {
  return TITLES.filter((t) => t.has(c)).map((t) => t.key);
}

export function titleName(key: string | null): string | null {
  return TITLES.find((t) => t.key === key)?.name ?? null;
}
