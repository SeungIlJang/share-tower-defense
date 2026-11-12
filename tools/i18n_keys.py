"""🌐 번역할 문구 모으기 — src의 tr('…') 첫 인자 + 데이터(유닛·적·관문) 이름.

사용: python -X utf8 tools/i18n_keys.py            → 빠진 번역 개수(en·ja)
      python -X utf8 tools/i18n_keys.py --missing  → 빠진 문구를 tools/i18n_missing.json으로(파일:줄 포함)
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..')
SRC = os.path.join(ROOT, 'src')
CALL = re.compile(r"(?<![\w.])tr\(\s*'((?:[^'\\\n]|\\.)*)'")


def unesc(s):
    return re.sub(r"\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|.)", lambda m: {
        'n': '\n', 't': '\t', 'r': '\r', '0': '\0'}.get(m.group(1), chr(int(m.group(1)[2:-1] if m.group(1).startswith('u{') else m.group(1)[1:], 16)) if m.group(1).startswith('u') and len(m.group(1)) > 1 else m.group(1)), s)


def collect():
    keys = {}
    for d, _, fs in os.walk(SRC):
        for f in fs:
            if not f.endswith('.ts') or f == 'i18n.ts':
                continue
            p = os.path.join(d, f)
            for n, line in enumerate(open(p, encoding='utf-8'), 1):
                for m in CALL.finditer(line):
                    keys.setdefault(unesc(m.group(1)), f'{os.path.relpath(p, ROOT)}:{n}')
    for f in ('units', 'enemies'):
        for k, v in json.load(open(os.path.join(SRC, 'data', f + '.json'), encoding='utf-8')).items():
            if isinstance(v, dict) and isinstance(v.get('name'), str):
                keys.setdefault(v['name'], f'data/{f}.json:{k}')
    for s in json.load(open(os.path.join(SRC, 'data', 'stages.json'), encoding='utf-8')):
        if isinstance(s.get('name'), str):
            keys.setdefault(s['name'], f"data/stages.json:{s.get('id')}")
    keys.setdefault('모두의 타워디펜스', 'index.html')
    return keys


if __name__ == '__main__':
    keys = collect()
    out = {}
    for lang in ('en', 'ja'):
        d = json.load(open(os.path.join(SRC, 'i18n', lang + '.json'), encoding='utf-8'))
        miss = [k for k in keys if not d.get(k)]
        unused = [k for k in d if k not in keys]
        print(lang, 'keys', len(keys), 'missing', len(miss), 'unused', len(unused))
        out[lang] = {k: keys[k] for k in miss}
    if '--missing' in sys.argv:
        json.dump(out, open(os.path.join(ROOT, 'tools', 'i18n_missing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
