/**
 * 🗺️ 월드 10개 · 관문 100개 — 1~20은 stages.json(직접 만든 관문), 21~100은 자동 생성. 순수 로직(Vitest 검증).
 * 21관문부터: 같은 자리(1~10번째) 관문의 웨이브 구성을 바탕으로 적 수·배율을 올리고, 월드마다 테마 적을 섞음.
 */
import baseStages from '../data/stages.json';
import type { StageData, Wave } from '../types';
import { statMult } from './upgrades';
import { bossForStage, isBoss } from './bosses';
import { EASY_STAGE } from './tutorial';

export interface WorldDef {
  id: number;
  name: string;
  theme: string; // 하늘·땅 색 키(ui/cute.ts SKY)
  color: number; // 스테이지 선택 리본·버튼
  dark: number;
  battle: [number, number, number]; // 전투 배경 [하늘, 레인, 레인 선]
  themed: string[]; // 이 월드에 더 나오는 적(웨이브에 섞음)
}

export const WORLDS: WorldDef[] = [
  { id: 1, name: '🌳 관문의 숲', theme: 'forest', color: 0x3f9a4a, dark: 0x2a6a32, battle: [0x121826, 0x1d2740, 0x33406a], themed: [] },
  { id: 2, name: '🏜️ 모래 사막', theme: 'desert', color: 0xd8862a, dark: 0xa05a10, battle: [0x2a1f18, 0x4a3826, 0x7a5a36], themed: [] },
  { id: 3, name: '❄️ 얼음 설원', theme: 'ice', color: 0x4aa8e0, dark: 0x2a78b0, battle: [0x142438, 0x2a4a68, 0x7ab8e0], themed: ['frost_wolf', 'ice_golem', 'wisp'] },
  { id: 4, name: '🌿 독 늪지', theme: 'swamp', color: 0x5a9a4a, dark: 0x3a6a2a, battle: [0x14221a, 0x24402a, 0x5a8a4a], themed: ['poison_slime', 'toxic_mushroom', 'goblin_shaman'] },
  { id: 5, name: '🌋 화산 지대', theme: 'volcano', color: 0xd8502a, dark: 0x9a2a10, battle: [0x2a1010, 0x4a2018, 0xa8482a], themed: ['lava_golem', 'baby_dragon', 'goblin_bomber'] },
  { id: 6, name: '🪦 망자의 묘지', theme: 'graveyard', color: 0x7a7a9a, dark: 0x4a4a6a, battle: [0x16161f, 0x2a2a38, 0x6a6a8a], themed: ['skeleton_archer', 'skeleton_knight', 'banshee', 'necromancer'] },
  { id: 7, name: '💎 수정 동굴', theme: 'crystal', color: 0x8a6ad8, dark: 0x5a3aa8, battle: [0x1a1430, 0x2e2450, 0x8a7ad8], themed: ['wisp', 'stone_golem', 'goblin_archer'] },
  { id: 8, name: '☁️ 하늘 섬', theme: 'sky', color: 0x5ab8f0, dark: 0x2a88c0, battle: [0x1a2a44, 0x2a4a6a, 0x9ad8ff], themed: ['vampire_bat', 'baby_dragon', 'banshee'] },
  { id: 9, name: '🌑 그림자 숲', theme: 'shadow', color: 0x4a3a6a, dark: 0x2a1a4a, battle: [0x0c0c18, 0x1a1a2a, 0x4a3a6a], themed: ['orc_berserker', 'necromancer', 'dire_wolf'] },
  { id: 10, name: '👹 마왕의 땅', theme: 'demon', color: 0xa82a3a, dark: 0x6a1020, battle: [0x1a080c, 0x341018, 0x8a2a2a], themed: ['orc_warchief', 'lava_golem', 'king_slime', 'skeleton_knight'] },
];

export const MAX_STAGE = WORLDS.length * 10;

/** 관문 → 월드(1~10) */
export function worldOf(id: number): number {
  return Math.min(WORLDS.length, Math.max(1, Math.ceil(id / 10)));
}

/** 21관문부터 적 체력·공격 배율 — 월드 2 끝(2.4)에서 관문마다 +0.09 (100관문 = 9.6) */
export function enemyMultFor(id: number): number {
  return Math.round((2.4 + 0.09 * (id - 20)) * 100) / 100;
}

/** 💰 월드가 깊을수록 클리어 골드 배율 — 월드 1 ×1.0 → 월드 10 ×2.35 */
export function goldMultFor(id: number): number {
  return Math.round((1 + 0.15 * (worldOf(id) - 1)) * 100) / 100;
}

/** 🎯 권장 유닛 강화 레벨 — 적 배율을 따라잡는 강화 레벨(최소 관문/4) */
export function recommendedLevel(id: number, enemyMult: number): number {
  let lv = 0;
  while (statMult(lv) < enemyMult && lv < 99) lv++;
  return Math.max(lv, Math.ceil(id / 4));
}

/** 21관문 이상 관문 하나 만들기 */
export function makeStage(id: number, base: StageData[]): StageData {
  const w = worldOf(id);
  const slot = (id - 1) % 10; // 월드 안 몇 번째(0~9)
  const tpl = base.find((s) => s.id === slot + 1)!; // 월드 1 같은 자리 관문
  const more = 1 + 0.08 * (w - 1); // 적 수 증가
  const themed = WORLDS[w - 1].themed;
  const waves: Wave[] = tpl.waves.map((wv, i) => {
    // 👑 보스(골렘·드래곤)는 그 관문의 월드 보스로 교체(5번째 = 앞 월드 보스, 10번째 = 이 월드 보스), 다른 자리는 골렘 그대로
    const boss = bossForStage(id);
    const enemies = wv.enemies.map((e) => {
      if (!isBoss(e.type)) return { ...e, count: Math.max(1, Math.round(e.count * more)) };
      const big = e.type === 'dragon' || (slot === 4 && e.type === 'ogre');
      return { ...e, type: big && boss ? boss : e.type };
    });
    // 🎭 월드 테마 적 — 두 번째 웨이브부터 관문이 깊어질수록 많이
    if (i >= 1 && themed.length) enemies.push({ type: themed[(slot + i) % themed.length], count: 1 + Math.floor(slot / 3), interval: 1.6 });
    return { ...wv, enemies };
  });
  return {
    id,
    name: `관문 ${id}`,
    world: w,
    baseHp: Math.round(tpl.baseHp * (1.4 + 0.12 * (w - 2))),
    startGold: Math.round(tpl.startGold * (1 + 0.05 * (w - 1))),
    goldRate: Math.round(tpl.goldRate * (1 + 0.05 * (w - 1))),
    enemyMult: enemyMultFor(id),
    waves,
  };
}

/** 전체 관문 100개 */
export function buildStages(base: StageData[]): StageData[] {
  // 1~20관문: 보스 자리를 그 관문 보스로 — 10 = 고대 나무 거인(드래곤 자리), 15 = 고대 나무 거인(마지막 골렘 자리), 20 = 레드 드래곤
  const out = base.map((s) => {
    const boss = bossForStage(s.id);
    if (!boss || s.id <= 5) return s;
    const from = s.id % 10 === 0 ? 'dragon' : 'ogre';
    const last = s.waves.length - 1;
    return {
      ...s,
      waves: s.waves.map((w, i) => ({
        ...w,
        enemies: w.enemies.map((e) => (e.type === from && (from === 'dragon' || i === last) ? { ...e, type: boss, count: 1 } : e)),
      })),
    };
  });
  for (let id = base.length + 1; id <= MAX_STAGE; id++) out.push(makeStage(id, base)); // 21~ 관문은 원래 구성(쉽게 하기 전)으로
  return out.map(easeStage);
}

/** 🐣 1~3관문 쉽게 — 적 수 줄이기, 1관문은 보스 없음 · 2~3관문은 보스 1마리(첫 승리를 2분 안에) */
export function easeStage(s: StageData): StageData {
  const k = EASY_STAGE[s.id];
  if (!k) return s;
  let bossLeft = s.id === 1 ? 0 : 1;
  const waves = s.waves.map((w) => ({
    ...w,
    enemies: w.enemies.flatMap((e) => {
      if (!isBoss(e.type)) return [{ ...e, count: Math.max(1, Math.round(e.count * k)) }];
      if (bossLeft <= 0) return [];
      bossLeft--;
      return [{ ...e, count: 1 }];
    }),
  }));
  return { ...s, waves: waves.filter((w) => w.enemies.length) };
}

export const STAGES: StageData[] = buildStages(baseStages as StageData[]);

/** 스테이지 선택 화면 보스 표시 — 그 관문의 보스 */
export function bossOf(id: number): string | null {
  return bossForStage(id);
}
