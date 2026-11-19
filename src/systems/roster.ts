/**
 * 🪜 관문별 적 명단 — 적 종류가 관문을 깰수록 한 종류씩 차례로 늘고 바뀜. 순수 로직(Vitest 검증).
 * - 관문마다 "주인공 적" 하나(FEATURED). 처음 나오는 적은 월드의 1·3·5·7번째 관문에 하나씩, 그 사이 관문은 전에 본 적이 돌아옴.
 * - 한 관문에 나오는 종류 = 최근 주인공 적 rosterCap(관문)종(1관문 1종 → 6관문부터 5종). 새 적이 들어오면 가장 오래된 적이 빠짐.
 * - 관문 틀(웨이브·마릿수)의 적을 이 명단의 적으로 바꿈. 체력 총합이 비슷하게 마릿수를 다시 셈(½~2배 안에서) → 적은 늘 제 능력치 그대로.
 * - 보스(골렘 두목 포함)는 건드리지 않음.
 */
import enemiesData from '../data/enemies.json';
import type { StageData, WaveEnemy } from '../types';
import { isBoss } from './bosses';
import { enemyKind } from './counters';

const E = enemiesData as unknown as Record<string, { hp: number }>;
const hpOf = (t: string): number => E[t]?.hp ?? 100;

/** 월드마다 관문 10개의 주인공 적 — 1·3·5·7번째 자리에 그 월드의 새 적 */
export const FEATURED: Record<number, string[]> = {
  1: ['goblin', 'slime', 'wolf', 'bat', 'orc', 'mushroom', 'ghost', 'skeleton', 'goblin', 'wolf'], // 🌳 기본 적 8종을 하나씩
  2: ['goblin_archer', 'orc', 'goblin_bomber', 'skeleton', 'skeleton_archer', 'bat', 'goblin', 'slime', 'goblin_bomber', 'skeleton_archer'], // 🏜️
  3: ['frost_wolf', 'skeleton', 'orc_shield', 'goblin_archer', 'wisp', 'frost_wolf', 'ice_golem', 'orc_shield', 'wisp', 'ice_golem'], // ❄️
  4: ['poison_slime', 'wolf', 'toxic_mushroom', 'orc', 'vampire_bat', 'poison_slime', 'goblin_shaman', 'toxic_mushroom', 'vampire_bat', 'goblin_shaman'], // 🌿
  5: ['dire_wolf', 'goblin_bomber', 'orc_berserker', 'skeleton', 'baby_dragon', 'dire_wolf', 'lava_golem', 'orc_berserker', 'baby_dragon', 'lava_golem'], // 🌋
  6: ['skeleton_knight', 'ghost', 'banshee', 'skeleton_archer', 'necromancer', 'skeleton', 'skeleton_knight', 'wisp', 'banshee', 'necromancer'], // 🪦
  7: ['stone_golem', 'wisp', 'goblin_archer', 'orc_shield', 'vampire_bat', 'stone_golem', 'skeleton_archer', 'ice_golem', 'wisp', 'stone_golem'], // 💎
  8: ['vampire_bat', 'ghost', 'banshee', 'bat', 'baby_dragon', 'wisp', 'ghost', 'banshee', 'vampire_bat', 'baby_dragon'], // ☁️ 하늘을 나는 적
  9: ['dire_wolf', 'goblin_shaman', 'orc_berserker', 'poison_slime', 'skeleton_knight', 'necromancer', 'toxic_mushroom', 'dire_wolf', 'vampire_bat', 'orc_berserker'], // 🌑
  10: ['king_slime', 'orc_berserker', 'orc_warchief', 'dire_wolf', 'lava_golem', 'skeleton_knight', 'banshee', 'baby_dragon', 'king_slime', 'orc_warchief'], // 👹
};

const WORLD1_CAP = [1, 2, 3, 4, 4, 5, 5, 5, 5, 5];
export const ROSTER_MAX = 5; // 한 관문에 나오는 보통 적 종류 수(보스 제외)
export const COUNT_MAX = 1.5; // 약한 적으로 바꿀 때 마릿수는 많아야 1.5배(화면이 넘치지 않게) — 모자란 체력은 관문 전체에 고르게 나눠 채움
export const LEVEL_MAX = 1.25; // 그 고르게 채우는(또는 덜어 내는) 배수의 한계
export const CROWD_MAX = 1.3; // 바꾼 뒤 총 마릿수는 원래의 이 배수까지
export const HP_FLOOR = 0.9; // 바꾼 뒤 체력 총합이 원래의 이 비율보다 낮으면 가벼운 적을 무거운 적으로 더 바꿈
/** 🧙 부하를 부르거나 갈라지는 적은 한 관문에 이 수까지만(넘는 몫은 명단의 다른 적으로) — 수십 마리가 되면 소환이 전장을 뒤덮음 */
export const RARE_MAX: Record<string, number> = { necromancer: 4, king_slime: 3, orc_warchief: 4 };
export const PROD_HP = 180;
export const ELITE_HP = 360; // 엘리트 부대로 나올 수 있는 적의 체력 한계 // 적 성이 계속 뽑는 적은 체력 이 이하(가벼운 적)만

/** 그 관문의 주인공 적 */
export function featuredOf(id: number): string {
  const s = Math.min(100, Math.max(1, id));
  return FEATURED[Math.ceil(s / 10)][(s - 1) % 10];
}

/** 그 관문에 나오는 보통 적 종류 수 */
export function rosterCap(id: number): number {
  return id <= 10 ? WORLD1_CAP[Math.max(1, id) - 1] : ROSTER_MAX;
}

/** 그 관문의 적 명단 — 주인공 적이 맨 앞, 그 뒤로 최근에 주인공이었던 순서 */
export function stageRoster(id: number): string[] {
  const out: string[] = [];
  const cap = rosterCap(id);
  for (let s = Math.min(100, Math.max(1, id)); s >= 1 && out.length < cap; s--) {
    const t = featuredOf(s);
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

/** 그 관문에서 처음 나오는 적(없으면 null) */
export function newEnemyAt(id: number): string | null {
  const t = featuredOf(id);
  for (let s = 1; s < id; s++) if (featuredOf(s) === t) return null;
  return t;
}

/** 그 적이 처음 나오는 관문(명단에 없는 적은 Infinity) */
export function introAt(type: string): number {
  for (let s = 1; s <= 100; s++) if (featuredOf(s) === type) return s;
  return Infinity;
}

/** ⭐ 엘리트 부대 이벤트의 3마리 — 명단에서 너무 크지 않은 적(체력 ELITE_HP 이하)을 돌아가며 */
export function eliteRoster(id: number): string[] {
  const r = stageRoster(id);
  const ok = r.filter((t) => hpOf(t) <= ELITE_HP);
  const pool = ok.length ? ok : [[...r].sort((a, b) => hpOf(a) - hpOf(b))[0]];
  return [0, 1, 2].map((i) => pool[i % pool.length]);
}

/** 적 성이 계속 뽑는 적 — 명단의 가벼운 적(없으면 가장 가벼운 적 하나) */
export function prodRoster(id: number): string[] {
  const r = stageRoster(id);
  const light = r.filter((t) => hpOf(t) <= PROD_HP);
  return light.length ? light : [[...r].sort((a, b) => hpOf(a) - hpOf(b))[0]];
}

/** 관문의 보통 적을 그 관문 명단의 적으로 바꿈 — 체력 총합이 비슷하게 마릿수를 다시 셈(보스는 그대로) */
export function castRoster(s: StageData): StageData {
  const allowed = stageRoster(s.id);
  // 원래 적 종류별 체력 총합(큰 것부터)
  const total = new Map<string, number>();
  for (const w of s.waves) for (const g of w.enemies) if (!isBoss(g.type)) total.set(g.type, (total.get(g.type) ?? 0) + g.count * hpOf(g.type));
  const src = [...total].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const sum = src.reduce((n, [, v]) => n + v, 0) || 1;
  const load = new Map(allowed.map((t) => [t, 0]));
  const to = new Map<string, string>();
  const put = (x: string, v: number, t: string): void => {
    to.set(x, t);
    load.set(t, (load.get(t) ?? 0) + v);
  };
  // 1) 가장 크고 체력이 비슷한 자리 = 주인공 적 · 2) 명단에 있는 적은 그대로 · 3) 아직 안 나온 명단 적부터 채움(같은 종류·비슷한 체력 우선)
  const far = (x: string, t: string): number => Math.abs(Math.log(hpOf(t) / hpOf(x)));
  const star = [...src].sort((p, q) => q[1] / (1 + far(q[0], allowed[0])) - p[1] / (1 + far(p[0], allowed[0])))[0];
  if (star) put(star[0], star[1], allowed[0]);
  for (const [x, v] of src) if (!to.has(x) && allowed.includes(x)) put(x, v, x);
  for (const [x, v] of src) {
    if (to.has(x)) continue;
    const unused = allowed.filter((t) => !load.get(t));
    const cost = (t: string): number => (load.get(t) ?? 0) / sum + (enemyKind(t) === enemyKind(x) ? 0 : 0.15) + 0.2 * far(x, t);
    put(x, v, [...(unused.length ? unused : allowed)].sort((p, q) => cost(p) - cost(q))[0]);
  }
  const fit = (mass: number, t: string): number => Math.abs(Math.log(mass / hpOf(t)));
  const rare = new Map<string, number>();
  const waves = s.waves.map((w) => {
    const out: WaveEnemy[] = [];
    for (const g of w.enemies) {
      if (isBoss(g.type)) {
        out.push(g);
        continue;
      }
      const mass = g.count * hpOf(g.type);
      let t = to.get(g.type) ?? allowed[0];
      // 큰 적 한 마리 몫도 안 되는 작은 묶음은 몫이 가장 맞는 적으로
      if (mass / hpOf(t) < 0.5) t = [...allowed].sort((a, b) => fit(mass, a) - fit(mass, b))[0];
      let count = Math.max(1, Math.round(g.count * Math.min(COUNT_MAX, hpOf(g.type) / hpOf(t))));
      const add = (type: string, n: number): void => {
        const same = out.find((o) => o.type === type);
        if (same) same.count += n;
        else out.push({ type, count: n, interval: g.interval });
      };
      const cap = RARE_MAX[t];
      if (cap !== undefined) {
        const room = Math.max(0, cap - (rare.get(t) ?? 0));
        if (count > room) {
          const rest = (count - room) * hpOf(t);
          const alt = allowed.filter((a) => RARE_MAX[a] === undefined).sort((a, b) => fit(rest, a) - fit(rest, b))[0];
          if (alt) add(alt, Math.max(1, Math.round(Math.min(COUNT_MAX * (count - room), rest / hpOf(alt)))));
          count = room;
        }
        rare.set(t, (rare.get(t) ?? 0) + count);
      }
      if (count > 0) add(t, count);
    }
    return { ...w, enemies: out };
  });
  // ⚖️ 체력 총합을 원래 관문에 맞춤 — 보통 적 마릿수를 같은 배수로(한계 LEVEL_MAX)
  const now = waves.reduce((n, w) => n + w.enemies.reduce((m, g) => m + (isBoss(g.type) ? 0 : g.count * hpOf(g.type)), 0), 0) || 1;
  const k = Math.min(LEVEL_MAX, Math.max(1 / LEVEL_MAX, sum / now));
  const scale = (m: number): void => {
    for (const w of waves) for (const g of w.enemies) if (!isBoss(g.type) && RARE_MAX[g.type] === undefined) g.count = Math.max(1, Math.round(g.count * m));
  };
  if (Math.abs(k - 1) > 0.04) scale(k);
  // 👥 그래도 원래보다 너무 많아지면(가벼운 적 위주 관문) 마릿수를 원래의 CROWD_MAX배까지로
  const heads = (ws: StageData['waves']): number => ws.reduce((n, w) => n + w.enemies.reduce((m, g) => m + (isBoss(g.type) ? 0 : g.count), 0), 0);
  const over = heads(waves) / (heads(s.waves) * CROWD_MAX);
  if (over > 1) scale(1 / over);
  // 🪶 가벼운 적 위주라 마릿수 한계에 걸려 체력이 모자라면 — 가장 가벼운 적 2마리를 가장 무거운 명단 적 1마리로(바닥: 원래의 30%, 주인공 적은 60%)
  const tally = (): Map<string, number> => {
    const m = new Map<string, number>();
    for (const w of waves) for (const g of w.enemies) if (!isBoss(g.type)) m.set(g.type, (m.get(g.type) ?? 0) + g.count);
    return m;
  };
  const start = tally();
  const heavy = [...start.keys()].filter((t) => RARE_MAX[t] === undefined).sort((a, b) => hpOf(b) - hpOf(a))[0];
  for (let i = 0; i < 200 && heavy; i++) {
    const have = tally();
    const hp = [...have].reduce((n, [t, c]) => n + c * hpOf(t), 0);
    if (hp >= sum * HP_FLOOR) break;
    const light = [...have.keys()]
      .filter((t) => t !== heavy && hpOf(heavy) > 2 * hpOf(t) && (have.get(t) ?? 0) - 2 >= Math.max(2, Math.ceil((start.get(t) ?? 0) * (t === allowed[0] ? 0.6 : 0.3))))
      .sort((a, b) => hpOf(a) - hpOf(b))[0];
    if (!light) break;
    const w = [...waves].sort((a, b) => (b.enemies.find((g) => g.type === light)?.count ?? 0) - (a.enemies.find((g) => g.type === light)?.count ?? 0))[0];
    const lg = w.enemies.find((g) => g.type === light);
    if (!lg || lg.count < 3) break;
    lg.count -= 2;
    const hg = w.enemies.find((g) => g.type === heavy);
    if (hg) hg.count += 1;
    else w.enemies.push({ type: heavy, count: 1, interval: lg.interval });
  }
  return { ...s, waves };
}
