import Phaser from 'phaser';
import { ANIM_STATES, LOOPING, animKey, iconKey, spriteOf, sprites, textureKey } from './sprites';
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

/** 로드된 스프라이트시트 → 필터·애니메이션 등록(Preload·나중 로드 공용). 실패하면 매니페스트에서 제거 */
export function registerSpriteAnims(scene: Phaser.Scene, type: string): void {
  const d = sprites.manifest[type];
  const key = textureKey(type);
  if (!d) return;
  if (!scene.textures.exists(key)) {
    delete sprites.manifest[type]; // 이미지 로드 실패 → 벡터 폴백
    return;
  }
  scene.textures.get(key).setFilter(d.filter === 'nearest' ? Phaser.Textures.FilterMode.NEAREST : Phaser.Textures.FilterMode.LINEAR);
  for (const s of ANIM_STATES) {
    const a = d.anims[s];
    if (!a || scene.anims.exists(animKey(type, s))) continue;
    scene.anims.create({
      key: animKey(type, s),
      frames: scene.anims.generateFrameNumbers(key, { frames: a.frames }),
      frameRate: a.fps,
      repeat: LOOPING[s] ? -1 : 0,
    });
  }
}

/** 그림 스킨(유닛@스킨)을 아직 안 받았으면 지금 받기 → 끝나면 done */
export function loadLook(scene: Phaser.Scene, look: string, done: () => void): void {
  const d = sprites.manifest[look];
  if (!d || scene.textures.exists(textureKey(look))) {
    done();
    return;
  }
  scene.load.spritesheet(textureKey(look), `sprites/${d.file}`, { frameWidth: d.frameWidth, frameHeight: d.frameHeight });
  if (d.icon) scene.load.image(iconKey(look), `sprites/${d.icon}`);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
    registerSpriteAnims(scene, look);
    done();
  });
  scene.load.start();
}

/** 스킨 텍스처·애니메이션 준비 → 쓸 이름(유닛@스킨). 원본 그림이 없으면 원래 이름 */
export function ensureSkin(scene: Phaser.Scene, type: string, skin: string | null | undefined): string {
  // 🟡 전설: 그림 시트(매니페스트 '유닛@legend')가 Preload에서 이미 로드됨
  if (skin === 'legend') return scene.textures.exists(textureKey(skinType(type, skin))) ? skinType(type, skin) : type;
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
