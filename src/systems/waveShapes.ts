/**
 * 🌊 웨이브 모양 6종 — 같은 적이라도 '어떻게 몰려오느냐'를 웨이브마다 다르게. 순수 로직(Vitest 검증).
 * 마릿수·종류는 그대로(난이도 유지), 나오는 순서와 시각만 바꿈. 관문 번호와 웨이브 구성으로 정해짐(무작위 아님).
 *  🐺 돌진 떼   — 빠른 적이 한 덩어리로 먼저
 *  🛡️ 방패 벽   — 단단한 적이 어깨를 맞대고 앞에, 원거리가 바로 뒤에
 *  🦇 하늘 습격 — 땅의 적과 싸우는 사이 비행 떼가 한꺼번에
 *  ⚠️ 뒤에서 기습 — 몇 마리가 우리 전선 뒤에서 튀어나옴(Battle)
 *  👹 거대 적 + 호위 — 큰 적이 호위에 둘러싸여 가운데에
 *  🔥 총공격   — 마지막 웨이브는 쉴 틈 없이 전부
 */
import { tr } from './i18n';

export type WaveShape = 'squad' | 'rush' | 'wall' | 'air' | 'ambush' | 'giant' | 'allout';

export const SHAPE_FROM = 5; // 이 관문부터 — 🚩 부대 명령(버티기 → 돌격)이 열리는 관문과 같음(모양에 맞설 수단과 함께 등장)
export const AMBUSH_FROM = 6;
export const AMBUSH_MAX = 4;
const FAST = 80; // 이동 속도 이 이상 = 빠른 적

export const SHAPE_INFO: Record<Exclude<WaveShape, 'squad'>, { icon: string; name: string }> = {
  rush: { icon: '🐺', name: tr('돌진 떼') },
  wall: { icon: '🛡️', name: tr('방패 벽') },
  air: { icon: '🦇', name: tr('하늘 습격') },
  ambush: { icon: '⚠️', name: tr('뒤에서 기습') },
  giant: { icon: '👹', name: tr('거대 적과 호위') },
  allout: { icon: '🔥', name: tr('총공격') },
};

/** 적 한 마리 */
export interface Slot {
  type: string;
  elite?: boolean;
  budget?: string;
  ambush?: boolean;
}
export interface Timed extends Slot {
  t: number; // 웨이브 시작 후 나오는 시각(초)
}

/** 모양을 정하는 데 쓰는 적 특징 */
export interface Trait {
  rank: number; // 0 근접 · 1 원거리 · 2 큰 적 · 3 보스
  speed: number;
  flying: boolean;
  armored: boolean;
}
export type TraitOf = (type: string) => Trait;

export interface ShapePace {
  gap: number;
  squad: number;
  squadGap: number;
}

const isFast = (t: Trait): boolean => t.rank < 2 && !t.flying && t.speed >= FAST;
const isSmallMelee = (t: Trait): boolean => t.rank === 0 && !t.flying;

/** 이 웨이브에 쓸 수 있는 모양들(총공격 제외) */
export function shapeChoices(stageId: number, slots: Slot[], traitOf: TraitOf, special = false): WaveShape[] {
  const ts = slots.map((s) => traitOf(s.type));
  const n = (f: (t: Trait) => boolean): number => ts.filter(f).length;
  const out: WaveShape[] = [];
  if (n((t) => t.rank === 2) >= 1 && n((t) => t.rank < 2) >= 3) out.push('giant');
  if (n((t) => t.flying && t.rank < 2) >= 4 && n((t) => !t.flying) >= 2) out.push('air');
  if (n(isFast) >= 4) out.push('rush');
  if (n((t) => t.armored && t.rank < 2) >= 3 && n((t) => !t.armored && t.rank < 2) >= 2) out.push('wall');
  if (!special && stageId >= AMBUSH_FROM && n(isSmallMelee) >= 6) out.push('ambush');
  return out;
}

/**
 * 웨이브 모양 — 마지막 웨이브는 총공격, 나머지는 구성에 맞는 것 중 관문·순번으로 하나.
 * used = 이 관문에서 앞 웨이브가 쓴 모양 — 안 쓴 모양을 먼저 고르고, 기습은 한 관문에 한 번만
 */
export function pickShape(stageId: number, index: number, total: number, slots: Slot[], traitOf: TraitOf, special = false, used: WaveShape[] = []): WaveShape {
  if (stageId < SHAPE_FROM) return 'squad';
  if (total >= 3 && index === total - 1) return 'allout';
  const all = shapeChoices(stageId, slots, traitOf, special).filter((s) => !(s === 'ambush' && used.includes('ambush')));
  const fresh = all.filter((s) => !used.includes(s));
  const c = fresh.length ? fresh : all;
  return c.length ? c[(stageId + index) % c.length] : 'squad';
}

/** 무리 지어(squad마리씩) 시각 매기기 — start부터, 끝난 시각을 돌려줌 */
function squads(list: Slot[], start: number, p: ShapePace, out: Timed[]): number {
  let t = start;
  list.forEach((s, k) => {
    if (k > 0) t += p.squad > 1 && k % p.squad === 0 ? p.squadGap : p.gap;
    out.push({ ...s, t });
  });
  return t;
}

/** 다닥다닥(step 간격) */
function pack(list: Slot[], start: number, step: number, out: Timed[]): number {
  list.forEach((s, k) => out.push({ ...s, t: start + k * step }));
  return start + Math.max(0, list.length - 1) * step;
}

/** 모양대로 순서·시각을 매김(들어온 순서 = 근접 → 원거리 → 큰 적 → 보스) */
export function arrange(shape: WaveShape, slots: Slot[], traitOf: TraitOf, p: ShapePace): Timed[] {
  const out: Timed[] = [];
  const tr0 = (s: Slot): Trait => traitOf(s.type);
  const split = (f: (s: Slot) => boolean): [Slot[], Slot[]] => [slots.filter(f), slots.filter((s) => !f(s))];
  const after = (t: number, list: Slot[], lead: number): number => (list.length ? squads(list, out.length ? t + lead : 0, p, out) : t);
  if (shape === 'rush') {
    const [fast, rest] = split((s) => isFast(tr0(s)));
    const t = pack(fast, 0, 0.15, out);
    after(t, rest, 2);
  } else if (shape === 'wall') {
    const [wall, rest0] = split((s) => tr0(s).armored && tr0(s).rank < 2);
    const [ranged, rest] = [rest0.filter((s) => tr0(s).rank === 1), rest0.filter((s) => tr0(s).rank !== 1)];
    let t = pack(wall, 0, 0.25, out);
    if (ranged.length) t = pack(ranged, t + 0.6, 0.3, out);
    after(t, rest, 1);
  } else if (shape === 'air') {
    const [fly, ground] = split((s) => tr0(s).flying && tr0(s).rank < 2);
    const [boss, land] = [ground.filter((s) => tr0(s).rank === 3), ground.filter((s) => tr0(s).rank !== 3)];
    let t = after(0, land, 0);
    t = pack(fly, t + 0.5, 0.12, out);
    after(t, boss, 1);
  } else if (shape === 'giant') {
    const big = slots.filter((s) => tr0(s).rank === 2);
    const boss = slots.filter((s) => tr0(s).rank === 3);
    const esc = slots.filter((s) => tr0(s).rank < 2);
    const half = Math.ceil(esc.length / 2);
    let t = after(0, esc.slice(0, half), 0);
    t = pack(big, t + 0.6, 0.8, out);
    t = pack(esc.slice(half), t + 0.3, 0.3, out);
    after(t, boss, 1);
  } else if (shape === 'ambush') {
    const cand = slots.filter((s) => isSmallMelee(tr0(s)) && !s.elite);
    const hide = new Set(cand.slice(0, Math.min(AMBUSH_MAX, Math.floor(cand.length / 3))));
    const front = slots.filter((s) => !hide.has(s));
    const end = after(0, front, 0);
    pack([...hide].map((s) => ({ ...s, ambush: true })), end * 0.45, 0.25, out);
  } else if (shape === 'allout') {
    const [boss, rest] = split((s) => tr0(s).rank === 3);
    const t = pack(rest, 0, 0.22, out);
    if (boss.length) pack(boss, rest.length ? t + 1 : 0, 0.8, out);
  } else {
    squads(slots, 0, p, out);
  }
  return out.sort((a, b) => a.t - b.t);
}
