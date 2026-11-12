/**
 * 🌐 언어팩 — 한국어(원문)·영어·일본어.
 * - 문구는 코드에 한국어 그대로 쓰고 tr('한국어')로 감쌈 → 한국어 문장이 곧 사전 키(src/i18n/en.json·ja.json)
 * - 바뀌는 값은 {0}·{1} 자리: tr('관문 {0}', id)
 * - 언어는 게임을 켤 때 한 번 정함(저장한 선택 → 없으면 휴대폰 언어: ko·ja 그대로, 그 외는 영어). 바꾸면 새로고침.
 * - 반드시 main.ts 맨 처음에 import — 데이터(유닛·적·관문 이름)를 다른 모듈보다 먼저 번역해 둠
 */
import en from '../i18n/en.json';
import ja from '../i18n/ja.json';
import unitsData from '../data/units.json';
import enemiesData from '../data/enemies.json';
import stagesData from '../data/stages.json';

export type Lang = 'ko' | 'en' | 'ja';
export const LANGS: { key: Lang; label: string }[] = [
  { key: 'ko', label: '한국어' },
  { key: 'en', label: 'English' },
  { key: 'ja', label: '日本語' },
];
const LANG_KEY = 'ld_lang';

/** 저장한 선택 · 휴대폰 언어 → 게임 언어(순수 — Vitest 검증) */
export function pickLang(saved: string | null | undefined, device: readonly string[]): Lang {
  if (saved === 'ko' || saved === 'en' || saved === 'ja') return saved;
  for (const d of device) {
    const p = (d || '').toLowerCase().slice(0, 2);
    if (p === 'ko' || p === 'ja') return p;
    if (p) return 'en';
  }
  return 'en';
}

function detect(): Lang {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(LANG_KEY) : null;
    return pickLang(saved, nav ? (nav.languages?.length ? nav.languages : [nav.language]) : ['ko']);
  } catch {
    return 'ko';
  }
}

/** 테스트(Node)에서는 한국어 원문 그대로 */
export const LANG: Lang = typeof window === 'undefined' ? 'ko' : detect();
const DICTS: Record<Lang, Record<string, string> | null> = { ko: null, en, ja };
const DICT = DICTS[LANG];

/** 문구 번역 — 사전에 없으면 한국어 그대로. {0}·{1}… 자리에 값을 넣음 */
export function tr(ko: string, ...args: (string | number)[]): string {
  const s = DICT?.[ko] || ko;
  return args.length ? s.replace(/\{(\d+)\}/g, (m, i: string) => (args[+i] !== undefined ? String(args[+i]) : m)) : s;
}

/** 언어 바꾸기 — 저장하고 새로고침(모든 화면·데이터를 새 언어로 다시 만듦) */
export function setLang(l: Lang): void {
  if (l === LANG) return;
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* 저장 못 해도 이번만 바꿈 */
  }
  location.reload();
}

/** 한국어 화면인지(문장 순서·띄어쓰기를 언어마다 다르게 할 때) */
export const isKo = LANG === 'ko';

// 📚 데이터 이름 번역(다른 모듈이 읽기 전에 제자리에서 바꿈)
if (DICT) {
  for (const o of [unitsData, enemiesData] as unknown as Record<string, { name?: string }>[])
    for (const v of Object.values(o)) if (v && typeof v.name === 'string') v.name = tr(v.name);
  for (const s of stagesData as unknown as { name?: string }[]) if (typeof s.name === 'string') s.name = tr(s.name);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = LANG;
    document.title = tr('모두의 타워디펜스');
  }
}
