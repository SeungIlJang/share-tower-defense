import Phaser from 'phaser';
import data from '../data/effects.json';

/**
 * 💥 전투 효과 팩 v1 — 스프라이트 시트(6열×2행·12프레임) + 합성 효과음. 원본: games/output/combat-effects-v1
 * 일반 타격(베기·치명타·화살·마법·회복)은 맞은 자리, 보스 효과는 시전자 발밑(왼쪽으로 펼쳐짐) 기준.
 * 효과마다 동시 재생 수·최소 간격 제한 → 난전에서도 화면·소리가 넘치지 않음.
 */
export type FxKey = keyof typeof data.effects;

interface FxDef {
  texture: string;
  audio: string;
  frameWidth: number;
  frameHeight: number;
  frames: number;
  fps: number;
  pivot: { x: number; y: number };
  volume: number;
  concurrency: number;
  cooldownMs: number;
}

const FX = data.effects as Record<FxKey, FxDef>;
const tex = (k: string): string => `fx_${k}`;
const snd = (k: string): string => `fxs_${k}`;
const BASE = 'effects/';

/** 소리는 압축본(OGG) 먼저, 못 쓰는 기기는 WAV */
const audioUrls = (path: string): string[] => [BASE + path.replace(/\.wav$/, '.ogg'), BASE + path];

/** 전투 효과 받기(BgLoad·전투 preload) — 이미 있는 것은 건너뜀 */
export function loadFx(scene: Phaser.Scene): void {
  for (const [k, d] of Object.entries(FX)) {
    if (!scene.textures.exists(tex(k))) scene.load.spritesheet(tex(k), BASE + d.texture, { frameWidth: d.frameWidth, frameHeight: d.frameHeight });
    if (!scene.cache.audio.exists(snd(k))) scene.load.audio(snd(k), audioUrls(d.audio));
  }
  if (!scene.cache.audio.exists(snd('warning'))) scene.load.audio(snd('warning'), audioUrls(data.warning.audio));
}

/** 전투 효과를 다 받았나 */
export function fxReady(scene: Phaser.Scene): boolean {
  return Object.keys(FX).every((k) => scene.textures.exists(tex(k)));
}

/** 로드 후 1번 — 애니메이션 등록 + 도트가 뭉개지지 않게 최근접 보간 */
export function registerFx(scene: Phaser.Scene): void {
  for (const [k, d] of Object.entries(FX)) {
    if (!scene.textures.exists(tex(k))) continue;
    scene.textures.get(tex(k)).setFilter(Phaser.Textures.FilterMode.NEAREST);
    if (!scene.anims.exists(tex(k))) scene.anims.create({ key: tex(k), frames: scene.anims.generateFrameNumbers(tex(k), { start: 0, end: d.frames - 1 }), frameRate: d.fps, repeat: 0 });
  }
}

const last = new Map<string, number>();
const live = new Map<string, number>();

/** 효과 재생 — 제한에 걸리면 그림·소리 모두 건너뜀(false). sound=false면 그림만 */
export function playFx(scene: Phaser.Scene, k: FxKey, x: number, y: number, o: { scale?: number; scaleY?: number; sound?: boolean; volume?: number; depth?: number } = {}): boolean {
  const d = FX[k];
  if (!d || !scene.textures.exists(tex(k))) return false;
  const now = scene.time.now;
  if (now - (last.get(k) ?? -1e9) < d.cooldownMs || (live.get(k) ?? 0) >= d.concurrency) return false;
  last.set(k, now);
  live.set(k, (live.get(k) ?? 0) + 1);
  const s = scene.add
    .sprite(x, y, tex(k))
    .setOrigin(d.pivot.x / d.frameWidth, d.pivot.y / d.frameHeight)
    .setScale(o.scale ?? 1, o.scaleY ?? o.scale ?? 1)
    .setDepth(o.depth ?? 75);
  s.once(Phaser.GameObjects.Events.DESTROY, () => live.set(k, Math.max(0, (live.get(k) ?? 1) - 1)));
  s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => s.destroy());
  s.play(tex(k));
  if (o.sound !== false && scene.cache.audio.exists(snd(k))) scene.sound.play(snd(k), { volume: d.volume * (o.volume ?? 1) });
  return true;
}

/** ⚠️ 보스 기술 예고음(0.8초 뒤 기술) */
export function fxWarning(scene: Phaser.Scene): void {
  if (scene.cache.audio.exists(snd('warning'))) scene.sound.play(snd('warning'), { volume: data.warning.volume });
}

/** 씬이 바뀌면 제한 카운트 초기화(남은 스프라이트는 씬과 함께 사라짐) */
export function resetFx(): void {
  live.clear();
  last.clear();
}
