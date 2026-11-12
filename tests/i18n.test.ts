import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import en from '../src/i18n/en.json';
import ja from '../src/i18n/ja.json';
import units from '../src/data/units.json';
import enemies from '../src/data/enemies.json';
import stages from '../src/data/stages.json';
import { pickLang, tr } from '../src/systems/i18n';

const SRC = join(__dirname, '..', 'src');
const CALL = /(?<![\w.])tr\(\s*'((?:[^'\\\n]|\\.)*)'/g;
const unesc = (s: string): string => s.replace(/\\(.)/g, (_, c: string) => ({ n: '\n', t: '\t', r: '\r' })[c] ?? c);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

/** 번역할 문구 — 코드의 tr('…') + 데이터 이름 */
function allKeys(): Set<string> {
  const keys = new Set<string>(['모두의 타워디펜스']);
  for (const p of walk(SRC)) {
    if (p.endsWith('i18n.ts')) continue;
    for (const m of readFileSync(p, 'utf-8').matchAll(CALL)) keys.add(unesc(m[1]));
  }
  for (const o of [units, enemies] as unknown as Record<string, { name?: string }>[]) for (const v of Object.values(o)) if (v?.name) keys.add(v.name);
  for (const s of stages as unknown as { name?: string }[]) if (s.name) keys.add(s.name);
  return keys;
}

const PH = /\{(\d+|n)\}/g;
const holes = (s: string): string[] => [...s.matchAll(PH)].map((m) => m[0]).sort();

describe('🌐 언어팩', () => {
  it('언어 고르기 — 저장한 선택 우선, 없으면 휴대폰 언어(ko·ja 외엔 영어)', () => {
    expect(pickLang('ja', ['ko-KR'])).toBe('ja');
    expect(pickLang(null, ['ko-KR', 'en'])).toBe('ko');
    expect(pickLang(null, ['ja-JP'])).toBe('ja');
    expect(pickLang(null, ['fr-FR', 'ko'])).toBe('en');
    expect(pickLang('xx', [])).toBe('en');
  });

  it('값 자리 채우기 — 테스트(한국어)는 원문 그대로', () => {
    expect(tr('관문 {0}', 7)).toBe('관문 7');
    expect(tr('{0}/{1}', 'a', 2)).toBe('a/2');
  });

  for (const [lang, dict] of [
    ['en', en],
    ['ja', ja],
  ] as const) {
    it(`${lang}: 모든 문구가 번역돼 있고 {0} 자리·줄바꿈 수가 같음`, () => {
      const d = dict as Record<string, string>;
      const missing: string[] = [];
      for (const k of allKeys()) {
        const v = d[k];
        if (!v) {
          missing.push(k);
          continue;
        }
        expect(holes(v), `${lang} ${k}`).toEqual(holes(k));
        expect(v.split('\n').length, `${lang} ${k}`).toBe(k.split('\n').length);
      }
      expect(missing).toEqual([]);
    });
  }
});
