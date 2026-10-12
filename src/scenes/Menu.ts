import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }
  create(): void {
    this.add
      .text(640, 230, '라인 디펜스', { fontFamily: 'sans-serif', fontSize: '64px', color: '#7cf6ff' })
      .setOrigin(0.5);
    this.add
      .text(640, 310, 'LINE DEFENSE · 프로토타입 v0.1', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#8892b0',
      })
      .setOrigin(0.5);
    const btn = this.add
      .text(640, 440, '▶ 시작', { fontFamily: 'sans-serif', fontSize: '40px', color: '#fff', backgroundColor: '#3a7bff', padding: { x: 36, y: 16 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('StageSelect'));
  }
}
