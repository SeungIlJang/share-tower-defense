import Phaser from 'phaser';
import stagesData from '../data/stages.json';
import type { StageData } from '../types';
import { meta } from '../systems/upgrades';

const stages = stagesData as StageData[];
const COLS = 4;
const ROWS = 6;
const SLOTS = COLS * ROWS; // 한 페이지 24칸
const WORLD = '관문의 숲';

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelect');
  }

  create(): void {
    // 배경 + 양피지 패널 (세로)
    this.add.rectangle(360, 640, 720, 1280, 0x241a10);
    this.add.rectangle(360, 660, 660, 1020, 0x5a4428).setStrokeStyle(6, 0x3a2a16);
    this.add.rectangle(360, 660, 624, 980, 0xc8a86a).setStrokeStyle(3, 0x8a6a3a);

    // 타이틀
    this.add.text(50, 70, '스테이지 선택', {
      fontFamily: 'sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#f5e6c0',
    });
    // 월드 배너
    this.add.rectangle(360, 148, 300, 50, 0x3f8a3f).setStrokeStyle(3, 0x2a5f2a);
    this.add
      .text(360, 148, WORLD, { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#eaffea' })
      .setOrigin(0.5);
    // 닫기(X)
    const close = this.add
      .text(676, 70, '✕', { fontFamily: 'sans-serif', fontSize: '34px', color: '#f5e6c0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => this.scene.start('Menu'));

    // 스테이지 그리드 (4열 × 6행)
    const cellW = 150;
    const cellH = 135;
    const startX = 360 - ((COLS - 1) * cellW) / 2;
    const startY = 250;
    for (let i = 0; i < SLOTS; i++) {
      const id = i + 1;
      const cx = startX + (i % COLS) * cellW;
      const cy = startY + Math.floor(i / COLS) * cellH;
      this.drawTile(id, cx, cy);
    }

    // UPGRADE 버튼 (하단)
    const up = this.add
      .rectangle(230, 1180, 240, 62, 0x8a4ec8)
      .setStrokeStyle(3, 0xd9b3ff)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(230, 1180, '🔧 UPGRADE', { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#fff' })
      .setOrigin(0.5);
    up.on('pointerdown', () => this.scene.start('Upgrade'));

    // 페이지 점(장식 — 추후 월드 확장)
    const dots = 5;
    for (let d = 0; d < dots; d++) {
      this.add.circle(440 + d * 24, 1182, 6, d === 0 ? 0x4ad0e0 : 0x6a5a40);
    }
  }

  private drawTile(id: number, cx: number, cy: number): void {
    const hasData = id <= stages.length;
    const unlocked = hasData && meta.isUnlocked(id);
    const cleared = id <= meta.clearedMax;

    const fill = unlocked ? (cleared ? 0x3f8a3f : 0xe0b84e) : 0x6b6256;
    const stroke = unlocked ? (cleared ? 0x7cff9e : 0xfff0b0) : 0x4a443a;
    const tile = this.add.rectangle(cx, cy, 128, 92, fill).setStrokeStyle(3, stroke);

    if (unlocked) {
      this.add
        .text(cx, cy - 6, String(id), {
          fontFamily: 'sans-serif',
          fontSize: '40px',
          fontStyle: 'bold',
          color: '#3a2a10',
        })
        .setOrigin(0.5);
      if (cleared)
        this.add.text(cx, cy + 24, '⭐', { fontSize: '18px' }).setOrigin(0.5);
      tile.setInteractive({ useHandCursor: true });
      tile.on('pointerdown', () => this.scene.start('Battle', { stageId: id }));
    } else {
      this.add.text(cx, cy, '🔒', { fontSize: '30px' }).setOrigin(0.5);
      this.add
        .text(cx + 34, cy, 'LOCK', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#cfc4b0' })
        .setOrigin(0, 0.5);
    }
  }
}
