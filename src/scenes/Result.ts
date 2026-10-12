import Phaser from 'phaser';
import { meta } from '../systems/upgrades';
import { showRewarded } from '../systems/ads';

interface ResultData {
  win: boolean;
  stageId: number;
  earned: number;
}

const W = 720;

export class ResultScene extends Phaser.Scene {
  private resultData!: ResultData;
  constructor() {
    super('Result');
  }
  init(data: ResultData): void {
    this.resultData = { win: data.win, stageId: data.stageId, earned: data.earned ?? 0 };
  }
  create(): void {
    const { win, earned } = this.resultData;
    this.add.rectangle(W / 2, 640, W, 1280, 0x0d1018).setDepth(-5);
    this.add
      .text(W / 2, 380, win ? '🏆 승리!' : '💀 패배', {
        fontFamily: 'sans-serif',
        fontSize: '76px',
        color: win ? '#5cff9e' : '#ff5a6e',
      })
      .setOrigin(0.5);

    const goldLine = this.add
      .text(W / 2, 520, win ? `획득 골드 🪙 ${earned}` : '보상 없음', {
        fontFamily: 'sans-serif',
        fontSize: '32px',
        color: '#ffd34d',
      })
      .setOrigin(0.5);
    this.add
      .text(W / 2, 572, `보유 골드 🪙 ${meta.gold}`, { fontFamily: 'sans-serif', fontSize: '20px', color: '#8ea0c0' })
      .setOrigin(0.5);

    let y = 680;
    if (win && earned > 0) {
      let doubled = false;
      const dbl = this.add
        .text(W / 2, y, '📺 광고 보고 골드 2배', { fontFamily: 'sans-serif', fontSize: '26px', color: '#fff', backgroundColor: '#8a5cff', padding: { x: 24, y: 13 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      dbl.on('pointerdown', () => {
        if (doubled) return;
        dbl.disableInteractive().setText('⏳ 광고…');
        void showRewarded().then((ok) => {
          if (ok) {
            doubled = true;
            meta.addGold(earned);
            goldLine.setText(`획득 골드 🪙 ${earned * 2} (2배!)`);
            dbl.setText('✅ 2배 완료').setBackgroundColor('#2a3550').setColor('#9fe0b5');
            this.floatGold(W / 2, y, earned);
          } else {
            dbl.setText('📺 광고 보고 골드 2배').setInteractive({ useHandCursor: true });
          }
        });
      });
      y += 110;
    }

    const retry = this.add
      .text(W / 2, y, '🔄 다시', { fontFamily: 'sans-serif', fontSize: '28px', color: '#fff', backgroundColor: '#3a7bff', padding: { x: 30, y: 14 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    retry.on('pointerdown', () => this.scene.start('Battle', { stageId: this.resultData.stageId }));

    const sel = this.add
      .text(W / 2, y + 90, '스테이지 선택', { fontFamily: 'sans-serif', fontSize: '24px', color: '#fff', backgroundColor: '#20304e', padding: { x: 22, y: 12 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    sel.on('pointerdown', () => this.scene.start('StageSelect'));
  }

  private floatGold(x: number, y: number, amount: number): void {
    const t = this.add.text(x, y - 30, `+${amount} 🪙`, { fontFamily: 'sans-serif', fontSize: '26px', color: '#ffd34d' }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
  }
}
