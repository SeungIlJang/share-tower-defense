import Phaser from 'phaser';
import stagesData from '../data/stages.json';
import type { StageData } from '../types';

const stages = stagesData as StageData[];

export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelect');
  }
  create(): void {
    this.add
      .text(640, 90, '스테이지 선택', { fontFamily: 'sans-serif', fontSize: '44px', color: '#7cf6ff' })
      .setOrigin(0.5);
    stages.forEach((s, i) => {
      const y = 220 + i * 110;
      const btn = this.add
        .rectangle(640, y, 420, 84, 0x20304e)
        .setStrokeStyle(2, 0x4a9eff)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(640, y, `${s.name}  (기지HP ${s.baseHp})`, {
          fontFamily: 'sans-serif',
          fontSize: '26px',
          color: '#fff',
        })
        .setOrigin(0.5);
      btn.on('pointerdown', () => this.scene.start('Battle', { stageId: s.id }));
    });
    const up = this.add
      .text(500, 660, '🔧 강화', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#ffd34d',
        backgroundColor: '#20304e',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    up.on('pointerdown', () => this.scene.start('Upgrade'));
    const back = this.add
      .text(760, 660, '← 메뉴', { fontFamily: 'sans-serif', fontSize: '22px', color: '#8892b0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('Menu'));
  }
}
