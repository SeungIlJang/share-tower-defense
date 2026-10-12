import Phaser from 'phaser';
import type { UnitStats } from '../types';

export interface HudState {
  lv: number;
  gold: number;
  energy: number;
  energyMax: number;
  food: number;
  foodMax: number;
  linePos: number; // 0(우리 기지) ~ 1(적 기지)
}

const UNIT_COLORS: Record<string, number> = {
  soldier: 0x4a9eff,
  archer: 0x5cff9e,
  knight: 0xb98cff,
};

/** 전투 HUD — 상단(LV·VS라인·골드) + 하단 9슬롯 유닛바 + 에너지/식량 바 */
export class Hud {
  private lvText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private vsBlue: Phaser.GameObjects.Rectangle;
  private vsRed: Phaser.GameObjects.Rectangle;
  private vsMark: Phaser.GameObjects.Triangle;
  private readonly vsX = 430;
  private readonly vsW = 360;

  private energyFill: Phaser.GameObjects.Rectangle;
  private energyText: Phaser.GameObjects.Text;
  private foodFill: Phaser.GameObjects.Rectangle;
  private foodText: Phaser.GameObjects.Text;

  private slotCostTexts: Record<string, Phaser.GameObjects.Text> = {};

  constructor(
    scene: Phaser.Scene,
    units: Record<string, UnitStats>,
    onSpawn: (type: string) => void
  ) {
    const d = 100;
    // ── 상단 바 ──
    scene.add.rectangle(640, 22, 1280, 44, 0x0d1424, 0.8).setDepth(d);
    this.lvText = scene.add
      .text(18, 22, 'LV 1', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' })
      .setOrigin(0, 0.5)
      .setDepth(d + 1);
    // VS 라인 바
    scene.add.rectangle(this.vsX + this.vsW / 2, 22, this.vsW + 4, 20, 0x000000, 0.5).setDepth(d);
    this.vsBlue = scene.add.rectangle(this.vsX, 22, this.vsW / 2, 16, 0x3aa0ff).setOrigin(0, 0.5).setDepth(d + 1);
    this.vsRed = scene.add.rectangle(this.vsX + this.vsW, 22, this.vsW / 2, 16, 0xff4a4a).setOrigin(1, 0.5).setDepth(d + 1);
    scene.add.text(this.vsX + this.vsW / 2, 22, 'VS', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    this.vsMark = scene.add.triangle(this.vsX + this.vsW / 2, 36, 0, 8, 10, 8, 5, 0, 0xffffff).setDepth(d + 2);
    this.goldText = scene.add
      .text(1262, 22, '🪙 0', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' })
      .setOrigin(1, 0.5)
      .setDepth(d + 1);

    // ── 자원 바 (슬롯 바 위) ──
    const by = 600;
    scene.add.rectangle(240, by, 400, 22, 0x000000, 0.5).setDepth(d);
    this.foodFill = scene.add.rectangle(42, by, 396, 18, 0xe0a24e).setOrigin(0, 0.5).setDepth(d + 1);
    this.foodText = scene.add.text(240, by, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(26, by, '🍖', { fontSize: '18px' }).setOrigin(0.5).setDepth(d + 2);

    scene.add.rectangle(1040, by, 400, 22, 0x000000, 0.5).setDepth(d);
    this.energyFill = scene.add.rectangle(842, by, 396, 18, 0x4ac8e0).setOrigin(0, 0.5).setDepth(d + 1);
    this.energyText = scene.add.text(1040, by, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(1256, by, '⚡', { fontSize: '18px' }).setOrigin(0.5).setDepth(d + 2);

    // ── 9칸 유닛 슬롯 바 ──
    const keys = Object.keys(units);
    const slotW = 128;
    const gap = 8;
    const startX = (1280 - (9 * slotW + 8 * gap)) / 2 + slotW / 2;
    for (let i = 0; i < 9; i++) {
      const cx = startX + i * (slotW + gap);
      const cy = 672;
      const key = keys[i];
      if (key) {
        const u = units[key];
        const slot = scene.add.rectangle(cx, cy, slotW, 78, 0x2a3348).setStrokeStyle(3, UNIT_COLORS[key] ?? 0x4a9eff).setDepth(d);
        scene.add.rectangle(cx - 36, cy - 8, 36, 36, UNIT_COLORS[key] ?? 0x4a9eff).setDepth(d + 1);
        scene.add.text(cx + 6, cy - 16, u.name, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#fff' }).setOrigin(0, 0.5).setDepth(d + 1);
        this.slotCostTexts[key] = scene.add.text(cx + 6, cy + 14, `⚡${u.cost} 🍖${u.pop}`, { fontFamily: 'sans-serif', fontSize: '13px', color: '#cfe' }).setOrigin(0, 0.5).setDepth(d + 1);
        scene.add.text(cx - 50, cy + 26, String(i + 1), { fontFamily: 'sans-serif', fontSize: '13px', color: '#8aa' }).setDepth(d + 1);
        slot.setInteractive({ useHandCursor: true });
        slot.on('pointerdown', () => onSpawn(key));
      } else {
        scene.add.rectangle(cx, cy, slotW, 78, 0x20242e).setStrokeStyle(3, 0x3a3f4a).setDepth(d);
        scene.add.text(cx, cy, '🔒', { fontSize: '28px' }).setOrigin(0.5).setDepth(d + 1);
      }
    }
  }

  update(s: HudState): void {
    this.lvText.setText(`LV ${s.lv}`);
    this.goldText.setText(`🪙 ${s.gold}`);
    const pos = Phaser.Math.Clamp(s.linePos, 0, 1);
    this.vsBlue.setSize(this.vsW * pos, 16);
    this.vsRed.setSize(this.vsW * (1 - pos), 16);
    this.vsMark.setX(this.vsX + this.vsW * pos);
    this.energyFill.setSize(396 * Phaser.Math.Clamp(s.energy / s.energyMax, 0, 1), 18);
    this.energyText.setText(`${Math.floor(s.energy)} / ${s.energyMax}`);
    this.foodFill.setSize(396 * Phaser.Math.Clamp(s.food / s.foodMax, 0, 1), 18);
    this.foodText.setText(`${s.food} / ${s.foodMax}`);
  }
}
