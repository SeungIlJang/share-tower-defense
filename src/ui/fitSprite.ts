import Phaser from 'phaser';

type Box = { left: number; top: number; right: number; bottom: number };
const boxes = new Map<string, Box | null>();

/** 그림 한 프레임에서 실제로 그려진 부분(투명 여백 제외) — 한 번 재면 기억 */
export function contentBox(scene: Phaser.Scene, tex: string, frame: number | string): Box | null {
  const id = `${tex}#${frame}`;
  const hit = boxes.get(id);
  if (hit !== undefined) return hit;
  let box: Box | null = null;
  try {
    const fr = scene.textures.getFrame(tex, frame);
    const w = fr.cutWidth;
    const h = fr.cutHeight;
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(fr.source.image as CanvasImageSource, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    let l = w;
    let t = h;
    let r = -1;
    let b = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (px[(y * w + x) * 4 + 3] > 40) {
          if (x < l) l = x;
          if (x > r) r = x;
          if (y < t) t = y;
          if (y > b) b = y;
        }
      }
    }
    if (r >= 0) box = { left: l, top: t, right: r + 1, bottom: b + 1 };
  } catch {
    box = null;
  }
  boxes.set(id, box);
  return box;
}

/** 🖼️ 그림을 칸(가운데 x,y · 최대 maxW×maxH)에 꽉 차게 — 프레임 여백이 아니라 실제 그림 크기로 맞춤 */
export function fitSprite(spr: Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, x: number, y: number, maxW: number, maxH: number): void {
  const fw = spr.frame.realWidth;
  const fh = spr.frame.realHeight;
  const box = contentBox(spr.scene, spr.texture.key, spr.frame.name) ?? { left: 0, top: 0, right: fw, bottom: fh };
  const cw = box.right - box.left;
  const ch = box.bottom - box.top;
  const sc = Math.min(maxW / cw, maxH / ch);
  spr.setOrigin(0.5).setScale(sc);
  const flip = spr.flipX ? -1 : 1;
  // 그림 가운데를 칸 가운데로
  spr.setPosition(x - ((box.left + box.right) / 2 - fw / 2) * sc * flip, y - ((box.top + box.bottom) / 2 - fh / 2) * sc);
}
