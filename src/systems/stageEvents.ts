import { tr } from './i18n';
/**
 * ⚠️ 특수 이벤트 목록 — 단계(관문·무한 웨이브)에 따라 열림. 순수 로직(Vitest 검증).
 * 관문은 마지막 웨이브 시작에 관문 번호로 정해진 이벤트 하나(무작위 아님 · 출전 준비에서 미리 보여 줌).
 * 무한 모드는 지금처럼 일정 시간마다 무작위.
 */
export type StageEventKey = 'bats' | 'wolves' | 'elites' | 'ghosts' | 'bombers' | 'poison' | 'skelArchers' | 'kingSlime' | 'necro' | 'babyDragons';

export interface StageEvent {
  key: StageEventKey;
  text: string;
  minLv: number;
}

export const STAGE_EVENTS: StageEvent[] = [
  { key: 'bats', text: tr('🦇 박쥐 떼 습격!'), minLv: 0 },
  { key: 'wolves', text: tr('🐺 늑대 무리 돌진!'), minLv: 0 },
  { key: 'elites', text: tr('⭐ 엘리트 부대 출현!'), minLv: 0 },
  { key: 'ghosts', text: tr('👻 유령 행렬!'), minLv: 0 },
  { key: 'bombers', text: tr('💣 고블린 폭탄 돌격!'), minLv: 3 },
  { key: 'poison', text: tr('🧪 독 부대 행진!'), minLv: 4 },
  { key: 'skelArchers', text: tr('🏹 해골 궁수대!'), minLv: 5 },
  { key: 'kingSlime', text: tr('🟡 킹 슬라임 출현!'), minLv: 6 },
  { key: 'necro', text: tr('💀 강령술사 등장!'), minLv: 8 },
  { key: 'babyDragons', text: tr('🐲 새끼 드래곤 무리!'), minLv: 9 },
];

/** 이 단계에서 나올 수 있는 이벤트 */
export function eventsFor(lv: number): StageEvent[] {
  return STAGE_EVENTS.filter((e) => lv >= e.minLv);
}

/** 관문의 이벤트(정해져 있음) — 1관문은 없음 */
export function stageEvent(stageId: number): StageEvent | null {
  if (stageId < 2) return null;
  const list = eventsFor(stageId);
  return list[(stageId * 7) % list.length];
}
