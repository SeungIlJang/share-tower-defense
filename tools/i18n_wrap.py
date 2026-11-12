"""🌐 한국어 문자열 → tr('…') 로 감싸는 변환기(한 번 쓰고 검수용으로 다시 돌릴 수 있음).

사용: python -X utf8 tools/i18n_wrap.py [--dry] 파일...
- '…'·"…" 안에 한글이 있으면 t('…')
- `…${a}…` 템플릿은 t('…{0}…', a)
- 건너뜀: 주석, 이미 tr( 안, 객체 키('키': 값), import 줄, === / !== 비교, case 라벨, type 선언 줄
"""
import re, sys

KO = re.compile(r'[가-힣]')


def esc_single(s):
    return s.replace('\\', '\\\\').replace("'", "\\'").replace('\n', '\\n').replace('\r', '\\r').replace('\t', '\\t')


def cook(raw, quote):
    """JS 문자열 원문(raw, 이스케이프 포함) → 실제 값"""
    out = []
    i = 0
    while i < len(raw):
        c = raw[i]
        if c == '\\' and i + 1 < len(raw):
            n = raw[i + 1]
            m = {'n': '\n', 't': '\t', 'r': '\r', '\\': '\\', "'": "'", '"': '"', '`': '`', '$': '$', '0': '\0', '{': '{', '}': '}'}
            if n in m:
                out.append(m[n]); i += 2; continue
            if n == 'u':
                if raw[i + 2] == '{':
                    j = raw.index('}', i)
                    out.append(chr(int(raw[i + 3:j], 16))); i = j + 1; continue
                out.append(chr(int(raw[i + 2:i + 6], 16))); i += 6; continue
            if n == '\n':
                i += 2; continue
            out.append(n); i += 2; continue
        out.append(c); i += 1
    return ''.join(out)


class Wrapper:
    def __init__(self, src):
        self.s = src
        self.keys = []
        self.flags = []

    def line_of(self, i):
        return self.s.count('\n', 0, i) + 1

    def prev_code(self, out):
        """출력 버퍼에서 바로 앞의 공백 아닌 텍스트"""
        txt = ''.join(out[-40:]) if out else ''
        return txt.rstrip()

    def next_code(self, j):
        k = j
        while k < len(self.s) and self.s[k] in ' \t\r\n':
            k += 1
        return self.s[k:k + 3]

    def skip_reason(self, start, end, out):
        prev = self.prev_code(out)
        line_start = self.s.rfind('\n', 0, start) + 1
        line = self.s[line_start:self.s.find('\n', start) if self.s.find('\n', start) >= 0 else len(self.s)]
        nxt = self.next_code(end)
        if re.search(r'(?<![\w.])tr\(\s*$', prev):
            return 'already'
        if line.lstrip().startswith(('import ', 'export type ', 'type ')):
            return 'type/import'
        if nxt.startswith(':') and (prev.endswith('{') or prev.endswith(',') or prev == ''):
            return 'key'
        if re.search(r'(===|!==|==|!=)\s*$', prev) or nxt.startswith(('===', '!==')):
            return 'compare'
        if re.search(r'\bcase\s*$', prev):
            return 'case'
        if re.search(r'\bin\s*$', prev) and False:
            return 'in'
        return None

    def read_string(self, i):
        q = self.s[i]
        j = i + 1
        while self.s[j] != q:
            if self.s[j] == '\\':
                j += 2
            else:
                j += 1
        return j + 1  # end exclusive

    def read_template(self, i):
        """템플릿 `…` → (end, parts, exprs(원문 범위 리스트)) — exprs 안은 다시 변환"""
        j = i + 1
        parts, exprs, cur = [], [], []
        while True:
            c = self.s[j]
            if c == '\\':
                cur.append(self.s[j:j + 2]); j += 2; continue
            if c == '`':
                parts.append(''.join(cur)); return j + 1, parts, exprs
            if c == '$' and self.s[j + 1] == '{':
                parts.append(''.join(cur)); cur = []
                k = self.scan_code(j + 2, stop='}')
                exprs.append((j + 2, k))
                j = k + 1; continue
            cur.append(c); j += 1

    def scan_code(self, i, stop=None):
        """코드 구간을 훑어 끝 위치 반환(괄호 짝 맞춤) — 변환 없이 위치만"""
        depth = 0
        j = i
        while j < len(self.s):
            c = self.s[j]
            if c in '\'"':
                j = self.read_string(j); continue
            if c == '`':
                j = self.read_template(j)[0]; continue
            if self.s.startswith('//', j):
                j = self.s.find('\n', j); j = len(self.s) if j < 0 else j; continue
            if self.s.startswith('/*', j):
                j = self.s.find('*/', j) + 2; continue
            if c == '{':
                depth += 1
            elif c == '}':
                if depth == 0 and stop == '}':
                    return j
                depth -= 1
            j += 1
        return j

    def convert(self, i, end):
        """[i,end) 코드 → 변환된 텍스트"""
        out = []
        j = i
        while j < end:
            c = self.s[j]
            if self.s.startswith('//', j):
                k = self.s.find('\n', j); k = end if k < 0 or k > end else k
                out.append(self.s[j:k]); j = k; continue
            if self.s.startswith('/*', j):
                k = self.s.find('*/', j) + 2
                out.append(self.s[j:k]); j = k; continue
            if c in '\'"':
                k = self.read_string(j)
                lit = self.s[j:k]
                if KO.search(lit):
                    why = self.skip_reason(j, k, out)
                    if why is None:
                        val = cook(lit[1:-1], c)
                        self.keys.append(val)
                        out.append("tr('" + esc_single(val) + "')")
                    else:
                        if why != 'already':
                            self.flags.append((self.line_of(j), why, lit[:60]))
                        if why == 'already':
                            self.keys.append(cook(lit[1:-1], c))
                        out.append(lit)
                else:
                    out.append(lit)
                j = k; continue
            if c == '`':
                k, parts, exprs = self.read_template(j)
                static_ko = any(KO.search(p) for p in parts)
                conv_exprs = [self.convert(a, b) for a, b in exprs]
                if static_ko:
                    why = self.skip_reason(j, k, out)
                    if why is None:
                        key = ''.join(cook(p, '`') + ('{%d}' % n if n < len(exprs) else '') for n, p in enumerate(parts))
                        self.keys.append(key)
                        args = ''.join(', ' + e.strip() for e in conv_exprs)
                        out.append("tr('" + esc_single(key) + "'" + args + ')')
                        j = k; continue
                    self.flags.append((self.line_of(j), why, self.s[j:j + 60]))
                # 그대로(안쪽 식만 변환)
                buf = ['`']
                for n, p in enumerate(parts):
                    buf.append(p)
                    if n < len(conv_exprs):
                        buf.append('${' + conv_exprs[n] + '}')
                buf.append('`')
                out.append(''.join(buf)); j = k; continue
            out.append(c); j += 1
        return ''.join(out)


def ensure_import(src, path):
    if re.search(r"import \{[^}]*\btr\b[^}]*\} from '[./]*(systems/)?i18n'", src):
        return src
    depth = path.replace('\\', '/').split('src/')[1].count('/')
    rel = ('../' * depth) + 'systems/i18n' if depth else './systems/i18n'
    if path.replace('\\', '/').endswith('systems/' + path.replace('\\', '/').split('/')[-1]):
        rel = './i18n'
    line = "import { tr } from '%s';\n" % rel
    # 마지막 import 문 뒤
    last = 0
    for m in re.finditer(r"^import [\s\S]*?from '[^']+';\n", src, re.M):
        last = m.end()
    return src[:last] + line + src[last:]


if __name__ == '__main__':
    dry = '--dry' in sys.argv
    files = [a for a in sys.argv[1:] if not a.startswith('--')]
    allkeys = []
    for p in files:
        s = open(p, encoding='utf-8').read()
        w = Wrapper(s)
        out = w.convert(0, len(s))
        allkeys += w.keys
        for ln, why, lit in w.flags:
            print(f'  SKIP {p}:{ln} [{why}] {lit}')
        if out != s and not dry:
            out = ensure_import(out, p)
            open(p, 'w', encoding='utf-8', newline='\n').write(out)
        print(p, len(w.keys))
    print('keys', len(allkeys), 'unique', len(set(allkeys)))
