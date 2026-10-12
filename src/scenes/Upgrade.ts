import Phaser from 'phaser';

/** 업그레이드 씬 (뼈대 — 유닛 영구 강화 지점) */
export class UpgradeScene extends Phaser.Scene {
  constructor() {
    super('Upgrade');
  }
  create(): void {
    this.add
      .text(640, 300, '🔧 업그레이드 (준비 중)', { fontFamily: 'sans-serif', fontSize: '36px', color: '#ffd34d' })
      .setOrigin(0.5);
    const back = this.add
      .text(640, 420, '← 스테이지 선택', { fontFamily: 'sans-serif', fontSize: '24px', color: '#fff', backgroundColor: '#3a7bff', padding: { x: 24, y: 12 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('StageSelect'));
  }
}
