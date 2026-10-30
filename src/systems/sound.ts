import Phaser from 'phaser';
import { storageGet, storageSet } from './storage';

/**
 * 효과음·배경음 (Ninja Adventure 팩, CC0) — public/audio/*.
 * 같은 효과음이 한 프레임에 수십 번 겹치지 않게 키별 최소 간격(throttle).
 */
export const SFX = [
  'hit',
  'slash',
  'arrow',
  'magic',
  'heal',
  'boom',
  'boom_big',
  'coin',
  'spawn',
  'skill',
  'weapon',
  'click',
  'alert',
  'levelup',
  'win',
  'lose',
  'boss', // 👑 보스 등장(합성 — tools/synth_sfx.py)
  'evolve', // ⭐ 진화·랭크업
  'collapse', // 🏰 적 성 무너짐
  'cutin', // ✨ 필살 컷인
] as const;
export type SfxKey = (typeof SFX)[number];
export type BgmKey = 'bgm_menu' | 'bgm_battle';

const VOLUME: Partial<Record<SfxKey, number>> = { hit: 0.25, slash: 0.3, arrow: 0.25, coin: 0.25, spawn: 0.4, magic: 0.3, boss: 0.55, evolve: 0.45, collapse: 0.6, cutin: 0.4 };
const GAP_MS: Partial<Record<SfxKey, number>> = { hit: 70, slash: 70, arrow: 70, magic: 90, coin: 60 };
const last: Partial<Record<SfxKey, number>> = {};
const MUTE_KEY = 'ld_mute';

/** Preload에서 호출 */
export function loadAudio(scene: Phaser.Scene): void {
  for (const k of SFX) scene.load.audio(k, [`audio/${k}.ogg`, `audio/${k}.wav`]); // 압축본(OGG) 먼저 — 안 되면 WAV
  scene.load.audio('bgm_menu', 'audio/bgm_menu.ogg');
  // bgm_battle은 뒤에서(BgLoad) 또는 첫 전투 preload에서 받음(첫 실행 다운로드 줄이기)
}

/** 저장된 음소거 설정 적용(Boot) */
export async function restoreMute(game: Phaser.Game): Promise<void> {
  game.sound.mute = (await storageGet(MUTE_KEY)) === '1';
}

export function setMute(scene: Phaser.Scene, mute: boolean): void {
  scene.sound.mute = mute;
  storageSet(MUTE_KEY, mute ? '1' : '0');
}

export function sfx(scene: Phaser.Scene, key: SfxKey, volume = 1): void {
  if (!scene.cache.audio.exists(key)) return;
  const now = performance.now();
  const gap = GAP_MS[key] ?? 0;
  if (gap && now - (last[key] ?? 0) < gap) return;
  last[key] = now;
  scene.sound.play(key, { volume: (VOLUME[key] ?? 0.5) * volume });
}

/** 배경음 — 이미 같은 곡이면 그대로, 다르면 교체(씬을 넘어 이어짐) */
export function bgm(scene: Phaser.Scene, key: BgmKey | null): void {
  const sm = scene.sound;
  const playing = sm.getAllPlaying().find((s) => s.key.startsWith('bgm_'));
  if (playing?.key === key) return;
  sm.getAll('bgm_menu').forEach((s) => s.stop());
  sm.getAll('bgm_battle').forEach((s) => s.stop());
  if (!key || !scene.cache.audio.exists(key)) return;
  const play = (): void => {
    if (!sm.getAllPlaying().some((s) => s.key === key)) sm.play(key, { loop: true, volume: 0.35 });
  };
  // 브라우저 자동재생 정책: 첫 터치 전엔 잠겨 있음 → 풀리면 재생
  if (sm.locked) sm.once(Phaser.Sound.Events.UNLOCKED, play);
  else play();
}
