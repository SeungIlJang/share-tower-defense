import Phaser from 'phaser';
import { sfx } from '../systems/sound';

/** 귀여운 UI 공용 — 하늘 배경 · 말랑 버튼 (메뉴·스테이지 선택 등에서 공유) */

export const GROUND_Y = 640;

/** 하늘 그라데이션 + 흘러가는 구름 + 반짝이 + 언덕 풀밭 */
/** 테마 색: [하늘 위, 하늘 아래, 먼 언덕, 땅, 땅 아래, 풀] */
const SKY = {
  forest: [0x7fd3ff, 0xd8f2ff, 0x9fe08a, 0x6cc35a, 0x58ab48, 0x86d873],
  desert: [0xffb26a, 0xffe7c2, 0xf3c98a, 0xe6b06a, 0xcf9550, 0xf2c98a],
} as const;

export function drawSky(scene: Phaser.Scene, opts: { stars?: number; ground?: boolean; theme?: keyof typeof SKY } = {}): void {
  const [top, bottom, hill, ground, ground2, grass] = SKY[opts.theme ?? 'forest'];
  const g = scene.add.graphics();
  g.fillGradientStyle(top, top, bottom, bottom, 1);
  g.fillRect(0, 0, 1280, 720);
  if (opts.ground !== false) {
    g.fillStyle(hill, 1);
    g.fillEllipse(260, 640, 900, 260);
    g.fillEllipse(1040, 650, 900, 240);
    g.fillStyle(ground, 1);
    g.fillRect(0, GROUND_Y - 6, 1280, 90);
    g.fillStyle(ground2, 1);
    g.fillRect(0, GROUND_Y + 34, 1280, 50);
    g.fillStyle(grass, 1);
    for (let x = 10; x < 1280; x += 46) g.fillTriangle(x, GROUND_Y - 6, x + 8, GROUND_Y - 18, x + 16, GROUND_Y - 6);
  }

  const cloud = (x: number, y: number, s: number, speed: number): void => {
    const c = scene.add.container(x, y);
    c.add([
      scene.add.ellipse(0, 0, 120 * s, 46 * s, 0xffffff),
      scene.add.ellipse(-36 * s, 6 * s, 70 * s, 36 * s, 0xffffff),
      scene.add.ellipse(38 * s, 8 * s, 80 * s, 34 * s, 0xffffff),
      scene.add.ellipse(6 * s, -16 * s, 70 * s, 44 * s, 0xffffff),
    ]);
    c.setAlpha(0.9);
    scene.tweens.add({ targets: c, x: x + 1500, duration: speed, repeat: -1, onRepeat: () => (c.x = -160) });
  };
  cloud(160, 110, 1, 70000);
  cloud(760, 70, 0.7, 90000);
  cloud(1100, 170, 0.9, 80000);
  cloud(420, 250, 0.6, 100000);

  for (let i = 0; i < (opts.stars ?? 18); i++) {
    const s = scene.add
      .text(Phaser.Math.Between(30, 1250), Phaser.Math.Between(20, 360), '✦', { fontSize: `${Phaser.Math.Between(12, 22)}px`, color: '#ffffff' })
      .setOrigin(0.5)
      .setAlpha(0);
    scene.tweens.add({ targets: s, alpha: 0.9, duration: 900, yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2500), hold: 300 });
  }
}

/** 둥근 말랑 버튼 — 아래 그림자 + 누르면 쏙 들어감 */
export function cuteButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: number,
  dark: number,
  fontSize: string,
  onClick: () => void
): Phaser.GameObjects.Container {
  const r = Math.min(h / 2, 28);
  const g = scene.add.graphics();
  const draw = (pressed: boolean): void => {
    const dy = pressed ? 5 : 0;
    g.clear();
    g.fillStyle(dark, 1).fillRoundedRect(-w / 2, -h / 2 + 6, w, h, r);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2 + dy, w, h, r);
    g.fillStyle(0xffffff, 0.28).fillRoundedRect(-w / 2 + 14, -h / 2 + 4 + dy, w - 28, h * 0.32, r * 0.5);
    g.lineStyle(3, 0xffffff, 0.9).strokeRoundedRect(-w / 2, -h / 2 + dy, w, h, r);
  };
  draw(false);
  const text = scene.add
    .text(0, 0, label, { fontFamily: 'sans-serif', fontSize, fontStyle: 'bold', color: '#ffffff', stroke: '#00000055', strokeThickness: 4 })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [g, text]).setDepth(20).setSize(w, h + 6);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.06, duration: 120 }));
  c.on('pointerout', () => {
    draw(false);
    text.y = 0;
    scene.tweens.add({ targets: c, scale: 1, duration: 120 });
  });
  c.on('pointerdown', () => {
    draw(true);
    text.y = 5;
  });
  c.on('pointerup', () => {
    draw(false);
    text.y = 0;
    sfx(scene, 'click');
    onClick();
  });
  return c;
}

/** 테두리 굵은 귀여운 제목 글씨 */
export function cuteTitle(scene: Phaser.Scene, x: number, y: number, text: string, size: number, stroke = '#3a5bd8'): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize: `${size}px`,
      fontStyle: 'bold',
      color: '#ffffff',
      stroke,
      strokeThickness: Math.round(size / 6),
      shadow: { offsetX: 0, offsetY: Math.round(size / 10), color: '#1f2f80', blur: 0, fill: true, stroke: true },
    })
    .setOrigin(0.5);
}
