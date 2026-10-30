import Phaser from 'phaser';

export interface TipOpts {
  from?: 'below' | 'above'; // 손가락 위치(아래에서 위로 👆 / 위에서 아래로 👇)
  drag?: boolean; // 좌우로 미는 손가락(영웅 이동)
  bubbleY?: number; // 말풍선 y(기본 = 전장 위쪽)
  bubbleLeft?: number; // 말풍선 왼쪽 끝 x(지정하면 가리키는 곳 옆에 붙임 — 버튼을 가리지 않게)
  depth?: number;
  ring?: number; // 대상 강조 원 반지름(0 = 없음)
  finger?: boolean; // 손가락 표시(기본 true)
  world?: boolean; // 🎥 전장 위(영웅·성)를 가리킴 — 카메라와 함께 움직임
}

/** 👆 손가락 안내 — 대상을 가리키는 손가락 + 강조 고리 + 말풍선. 한 번에 하나만 */
export class TipPointer {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Container | null = null;
  private finger: Phaser.GameObjects.Text | null = null;
  private ringObj: Phaser.GameObjects.Arc | null = null;
  private from: 'below' | 'above' = 'below';
  key: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(key: string, x: number, y: number, text: string, o: TipOpts = {}): void {
    this.hide();
    const s = this.scene;
    this.key = key;
    this.from = o.from ?? 'below';
    const layer = s.add.container(0, 0).setDepth(o.depth ?? 150);
    if (o.world) layer.setData('world', true);
    this.layer = layer;
    const r = o.ring ?? 52;
    if (r > 0) {
      this.ringObj = s.add.circle(x, y, r).setStrokeStyle(5, 0xffe14d, 1);
      layer.add(this.ringObj);
      s.tweens.add({ targets: this.ringObj, scale: 1.25, alpha: 0.2, duration: 650, repeat: -1 });
    }
    this.finger = s.add
      .text(x, y, this.from === 'below' ? '👆' : '👇', {
        fontSize: '58px',
        padding: { top: 14, bottom: 6 },
      })
      .setOrigin(0.5, this.from === 'below' ? 0 : 1);
    layer.add(this.finger);
    this.finger.setVisible(o.finger ?? true);
    this.placeFinger(x, y);
    if (o.drag)
      s.tweens.add({
        targets: this.finger,
        x: x + 130,
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    else
      s.tweens.add({
        targets: this.finger,
        y: this.finger.y + (this.from === 'below' ? 14 : -14),
        duration: 420,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    const bubble = s.add
      .text(o.bubbleLeft ?? (o.world ? Math.max(300, x) : Phaser.Math.Clamp(x, 300, 980)), o.bubbleY ?? 200, text, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#3a2a10',
        align: 'center',
        lineSpacing: 6,
        backgroundColor: '#fff4c8',
        padding: { x: 20, y: 12 },
      })
      .setOrigin(o.bubbleLeft !== undefined ? 0 : 0.5, 0.5); // bubbleLeft: 말풍선 왼쪽 끝(가리키는 버튼 옆에 붙임)
    layer.add(bubble);
    layer.setAlpha(0);
    s.tweens.add({ targets: layer, alpha: 1, duration: 250 });
    s.tweens.add({
      targets: bubble,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  private placeFinger(x: number, y: number): void {
    if (!this.finger) return;
    this.finger.setPosition(x + 6, this.from === 'below' ? y + 18 : y - 18);
  }

  hide(): void {
    if (this.layer) {
      this.scene.tweens.killTweensOf(this.layer.list);
      this.scene.tweens.killTweensOf(this.layer);
      this.layer.destroy();
    }
    this.layer = null;
    this.finger = null;
    this.ringObj = null;
    this.key = null;
  }
}
