/**
 * 📦 나눠 받기 — 첫 실행엔 메인 화면에 필요한 것만(약 3~4MB), 나머지(적·보스 그림·전투 효과·전투 배경음)는
 * 메인 화면이 뜬 뒤 뒤에서 조금씩(BgLoad 씬), 화면에 들어갈 때 아직 없으면 그 화면 preload에서 바로 받음.
 * 그림이 아직 없어도 게임은 멈추지 않음(유닛·적은 벡터 도형, 효과는 건너뜀) — 대신 들어가기 전에 받아 둠.
 */
import Phaser from 'phaser';
import enemiesData from '../data/enemies.json';
import unitsData from '../data/units.json';
import type { StageData } from '../types';
import { iconKey, sprites, textureKey } from './sprites';
import { registerSpriteAnims } from './skinTextures';
import { fxReady, loadFx, registerFx } from './fx';
import { WORLDS } from './worlds';
import { BOSSES } from './bosses';
import { castleLook } from './castle';

const ENEMIES = enemiesData as Record<string, { look?: string; minStage?: number; variantOf?: string }>;

/** 메인 화면 행진 — 첫 화면에 바로 보이므로 처음부터 받음 */
export const PARADE_ALLY = ['knight', 'soldier', 'archer', 'cleric', 'mage', 'spear'];
export const PARADE_ENEMY = ['slime', 'goblin', 'mushroom', 'ghost'];

export function isEnemyType(t: string): boolean {
  return t in ENEMIES;
}

/** 🏰 성 진화 단계 그림(base_ally_t2 … base_enemy_t5) — 기본 성(메인 화면)은 제외 */
export function castleTierType(t: string): boolean {
  return /^base_(ally|enemy)_t\d+$/.test(t);
}

/** 나중에 받아도 되는 그림(적·보스 — 행진하는 적 제외 · 성 진화 단계) */
export function deferredType(t: string): boolean {
  return (isEnemyType(t) && !PARADE_ENEMY.includes(t)) || castleTierType(t);
}

/** 성 그림 이름 — 우리 성 지금 단계(+다음 단계: 전투 중 상점 강화) · 적 성 단계들 */
export function castleTypes(allyTier: number, enemyTiers: number[]): string[] {
  return [castleLook('ally', allyTier), castleLook('ally', allyTier + 1), ...enemyTiers.map((t) => castleLook('enemy', t))];
}

/** 적 그림 이름 + 그 적이 빌려 쓰는 그림 */
function withLooks(types: Iterable<string>): string[] {
  const out = new Set<string>();
  for (const t of types) {
    out.add(t);
    const look = ENEMIES[t]?.look;
    if (look) out.add(look);
  }
  return [...out];
}

/** 이 관문 전투에 나올 수 있는 적(웨이브 · 변종 · 보스 졸개 · 월드 테마 적) */
export function stageEnemyTypes(stage: StageData, extraBoss?: string | null): string[] {
  const set = new Set<string>();
  for (const w of stage.waves) for (const e of w.enemies) set.add(e.type);
  if (extraBoss) set.add(extraBoss);
  for (const [k, v] of Object.entries(ENEMIES)) if (v.variantOf && set.has(v.variantOf) && (v.minStage ?? 1) <= stage.id) set.add(k); // 👾 변종
  for (const t of [...set]) {
    const s = BOSSES[t]?.summon?.type;
    if (s) set.add(s); // 👑 보스 졸개(버섯·해골 등)
  }
  for (const t of WORLDS[(stage.world ?? 1) - 1]?.themed ?? []) set.add(t); // 🎭 월드 테마 적
  return withLooks(set);
}

/** 모든 적(무한 모드·오늘의 도전·도감) */
export function allEnemyTypes(): string[] {
  return withLooks(Object.keys(ENEMIES));
}

/** 이 씬의 로더에 아직 없는 그림만 넣음 → 넣은 이름들 */
export function queueTypes(scene: Phaser.Scene, types: string[]): string[] {
  const out: string[] = [];
  for (const t of types) {
    const d = sprites.manifest[t];
    if (!d || scene.textures.exists(textureKey(t))) continue;
    scene.load.spritesheet(textureKey(t), `sprites/${d.file}`, { frameWidth: d.frameWidth, frameHeight: d.frameHeight });
    if (d.icon && !scene.textures.exists(iconKey(t))) scene.load.image(iconKey(t), `sprites/${d.icon}`);
    out.push(t);
  }
  return out;
}

/** 받은 뒤 애니메이션 등록 */
export function registerTypes(scene: Phaser.Scene, types: string[]): void {
  for (const t of types) if (scene.textures.exists(textureKey(t))) registerSpriteAnims(scene, t);
}

/** 화면에 들어가기 전에 필요한 것 받기(씬 preload에서) — 받을 게 있으면 진행 막대 */
export function preloadNeeded(scene: Phaser.Scene, types: string[], o: { fx?: boolean; battleBgm?: boolean } = {}): void {
  const queued = queueTypes(scene, types);
  const fx = !!o.fx && !fxReady(scene);
  if (fx) loadFx(scene);
  if (o.battleBgm && !scene.cache.audio.exists('bgm_battle')) scene.load.audio('bgm_battle', 'audio/bgm_battle.ogg');
  if (!queued.length && !fx && !(o.battleBgm && !scene.cache.audio.exists('bgm_battle'))) return;
  const bar = loadingBar(scene);
  scene.load.on(Phaser.Loader.Events.PROGRESS, bar.set);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    scene.load.off(Phaser.Loader.Events.PROGRESS, bar.set);
    registerTypes(scene, queued);
    if (fx) registerFx(scene);
    bar.destroy();
  });
}

/** 가운데 작은 진행 막대 */
export function loadingBar(scene: Phaser.Scene, y = 360, label = '불러오는 중'): { set: (v: number) => void; destroy: () => void } {
  const bg = scene.add.rectangle(640, y, 360, 14, 0x000000, 0.5).setStrokeStyle(1, 0x3a4560).setDepth(1000);
  const fill = scene.add.rectangle(462, y, 0, 10, 0xffd34d).setOrigin(0, 0.5).setDepth(1001);
  const txt = scene.add.text(640, y - 26, `${label}… 0%`, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#cfd8ea' }).setOrigin(0.5).setDepth(1001);
  return {
    set: (v: number) => {
      fill.width = 356 * Phaser.Math.Clamp(v, 0, 1);
      txt.setText(`${label}… ${Math.round(v * 100)}%`);
    },
    destroy: () => {
      bg.destroy();
      fill.destroy();
      txt.destroy();
    },
  };
}

/** 🏷️ 유닛 그림 이름(기본 + 진화·전설 단계) — 강화 화면처럼 모든 유닛을 보여 줄 때 */
export function unitTypes(): string[] {
  return Object.keys(unitsData);
}

/**
 * 🔄 뒤에서 나머지 받기 — 메인 화면이 뜬 뒤 계속 실행되는 보이지 않는 씬.
 * 한 번에 2개씩만 받아서 화면 반응을 막지 않음. 가까운 관문의 적부터.
 */
export class BgLoadScene extends Phaser.Scene {
  constructor() {
    super('BgLoad');
  }

  create(data: { first?: string[] }): void {
    const all = Object.keys(sprites.manifest).filter(deferredType);
    const first = (data.first ?? []).filter((t) => all.includes(t));
    const order = [...new Set([...first, ...all])];
    this.load.maxParallelDownloads = 2;
    const queued = queueTypes(this, order);
    const fx = !fxReady(this);
    if (fx) loadFx(this);
    if (!this.cache.audio.exists('bgm_battle')) this.load.audio('bgm_battle', 'audio/bgm_battle.ogg');
    // 그림 하나 받을 때마다 바로 쓸 수 있게 애니메이션 등록
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string, type: string) => {
      if (type === 'spritesheet' && key.startsWith('spr_')) registerTypes(this, [key.slice(4)]);
    });
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      registerTypes(this, queued);
      if (fx) registerFx(this);
    });
    this.load.start();
  }
}
