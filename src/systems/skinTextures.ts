import Phaser from 'phaser';
import { ANIM_STATES, LOOPING, animKey, iconKey, spriteOf, textureKey } from './sprites';
import { SKINS, recolorPixels, skinType } from './skins';

/**
 * 👗 스킨 텍스처 — 원본 스프라이트시트·얼굴 아이콘을 캔버스에 그려 대표 색만 바꾼 사본 생성(게임 안에서, 한 번만).
 * 결과 이름: spr_<유닛>@<스킨>, icon_<유닛>@<스킨>, 애니 <유닛>@<스킨>_<동작>
 */
function recoloredCanvas(src: HTMLImageElement | HTMLCanvasElement, swaps: Parameters<typeof recolorPixels>[1]): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(src, 0, 0);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  recolorPixels(img.data, swaps);
  ctx.putImageData(img, 0, 0);
  return c;
}

/** 스킨 텍스처·애니메이션 준비 → 쓸 이름(유닛@스킨). 원본 그림이 없으면 원래 이름 */
export function ensureSkin(scene: Phaser.Scene, type: string, skin: string | null | undefined): string {
  const sk = skin ? SKINS[type] : undefined;
  const base = textureKey(type);
  if (!sk || sk.id !== skin || !scene.textures.exists(base)) return type;
  const st = skinType(type, skin);
  const key = textureKey(st);
  if (scene.textures.exists(key)) return st;

  const d = spriteOf(type)!;
  const srcTex = scene.textures.get(base);
  const canvas = recoloredCanvas(srcTex.getSourceImage() as HTMLImageElement, sk.swaps);
  const tex = scene.textures.addCanvas(key, canvas)!;
  const cols = Math.floor(canvas.width / d.frameWidth);
  const rows = Math.floor(canvas.height / d.frameHeight);
  for (let i = 0; i < cols * rows; i++) {
    tex.add(i, 0, (i % cols) * d.frameWidth, Math.floor(i / cols) * d.frameHeight, d.frameWidth, d.frameHeight);
  }
  tex.setFilter(d.filter === 'nearest' ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR);
  for (const s of ANIM_STATES) {
    const a = d.anims[s];
    if (!a || scene.anims.exists(animKey(st, s))) continue;
    scene.anims.create({
      key: animKey(st, s),
      frames: a.frames.map((f) => ({ key, frame: f })),
      frameRate: a.fps,
      repeat: LOOPING[s] ? -1 : 0,
    });
  }
  // 얼굴 아이콘도
  if (scene.textures.exists(iconKey(type)) && !scene.textures.exists(iconKey(st))) {
    const ic = scene.textures.get(iconKey(type)).getSourceImage() as HTMLImageElement;
    scene.textures.addCanvas(iconKey(st), recoloredCanvas(ic, sk.swaps));
  }
  return st;
}
