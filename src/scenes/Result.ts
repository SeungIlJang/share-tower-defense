import Phaser from 'phaser';

interface ResultData {
  win: boolean;
  stageId: number;
}

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultData;
  constructor() {
    super('Result');
  }
  init(data: ResultData): void {
    this.resultData = data;
  }
  create(): void {
    const win = this.resultData.win;
    this.add
      .text(640, 260, win ? '🏆 승리!' : '💀 패배', {
        fontFamily: 'sans-serif',
        fontSize: '72px',
        color: win ? '#5cff9e' : '#ff5a6e',
      })
      .setOrigin(0.5);
    const retry = this.add
      .text(640, 420, '다시', { fontFamily: 'sans-serif', fontSize: '32px', color: '#fff', backgroundColor: '#3a7bff', padding: { x: 30, y: 14 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    retry.on('pointerdown', () => this.scene.start('Battle', { stageId: this.resultData.stageId }));
    const sel = this.add
      .text(640, 510, '스테이지 선택', { fontFamily: 'sans-serif', fontSize: '24px', color: '#8892b0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    sel.on('pointerdown', () => this.scene.start('StageSelect'));
  }
}
