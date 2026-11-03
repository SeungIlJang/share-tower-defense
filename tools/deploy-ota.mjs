// OTA 배포: dist/ 를 games 레포(seungiljang.github.io/games/linedefense/)로 옮긴다.
//
// 앱(capacitor.config.ts 의 server.url)은 저 주소를 직접 띄운다. AAB 안에는 게임이 없다.
// 그래서 src 를 고치고 빌드만 해서는 아무것도 바뀌지 않는다 — 여기로 옮겨야 반영된다.
// 2026-11-02 에 광고 분기를 고치고 이 단계를 빠뜨려서, 소스만 바뀌고 서빙되는 번들은
// 그대로인 상태로 하루를 보냈다.
//
// 사용: npm run deploy          (빌드 + 복사 — 커밋·푸시는 games 레포에서 직접)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const HERE = path.resolve(import.meta.dirname, '..');
const DIST = path.join(HERE, 'dist');
// games 레포는 이 프로젝트 옆에 체크아웃돼 있다 (SeungIlJang/games)
const DEST = process.argv[2] || path.join(HERE, '..', 'games', 'linedefense');

if (!fs.existsSync(path.join(DIST, 'index.html')))
  throw new Error('dist/index.html 이 없다 — npm run build 를 먼저 돌려라');
if (!fs.existsSync(path.dirname(DEST)))
  throw new Error('games 레포를 찾을 수 없다: ' + DEST);

// 해시가 바뀐 옛 번들이 남지 않도록 통째로 비우고 다시 깐다.
// (assets/index-*.js 는 빌드마다 이름이 달라져서, 덮어쓰기만 하면 쓰레기가 쌓인다)
fs.rmSync(DEST, { recursive: true, force: true });
fs.cpSync(DIST, DEST, { recursive: true });

// index.html 이 참조하는 번들이 실제로 복사됐는지 확인한다.
// 이게 어긋나면 앱이 흰 화면만 띄운다.
const html = fs.readFileSync(path.join(DEST, 'index.html'), 'utf8');
for (const ref of html.match(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g) ?? []) {
  const rel = ref.match(/(assets\/[^"]+)"/)[1];
  if (!fs.existsSync(path.join(DEST, rel))) throw new Error(`index.html 이 없는 파일을 참조한다: ${rel}`);
}

let files = 0, bytes = 0;
(function walk(p) {
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    const q = path.join(p, e.name);
    if (e.isDirectory()) walk(q); else { files++; bytes += fs.statSync(q).size; }
  }
})(DEST);
console.log(`배포본 생성 · ${path.relative(path.join(HERE, '..'), DEST)} · 파일 ${files}개 · ${(bytes / 1048576).toFixed(1)}MB`);

// 출처를 games/ota-sources.json 에 남긴다. games 의 신선도 검사(tools/check-ota-freshness.mjs)가
// 이 커밋을 소스 저장소의 현재 HEAD 와 비교해서, 복사를 빠뜨리면 CI 가 빨간불을 낸다.
const git = (...a) => execFileSync('git', a, { cwd: HERE }).toString().trim();
const sources = path.join(path.dirname(DEST), 'ota-sources.json');
const all = fs.existsSync(sources) ? JSON.parse(fs.readFileSync(sources, 'utf8')) : {};
const dirty = git('status', '--porcelain') !== '';
all['linedefense'] = { repo: 'share-tower-defense', commit: git('rev-parse', 'HEAD'), dirty, builtAt: new Date().toISOString() };
// 키 순서를 고정해야 다른 앱을 배포할 때 쓸데없는 diff 가 생기지 않는다.
const sorted = Object.fromEntries(Object.keys(all).sort().map(k => [k, all[k]]));
fs.writeFileSync(sources, JSON.stringify(sorted, null, 2) + '\n');
if (dirty) console.warn('⚠️ 커밋 안 된 변경이 있는 상태로 빌드했다 — 기록한 커밋이 이 배포본과 다르다');

console.log('다음: games 레포에서 linedefense/ 와 ota-sources.json 커밋·푸시');
