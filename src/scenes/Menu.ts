import Phaser from 'phaser';
import { meta } from '../systems/upgrades';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }
  create(): void {
    this.add
      .text(640, 230, '모두의 타워디펜스', { fontFamily: 'sans-serif', fontSize: '58px', fontStyle: 'bold', color: '#7cf6ff' })
      .setOrigin(0.5);
    this.add
      .text(640, 306, 'TOWER DEFENSE · v1.7 · ⏱️리듬 소환', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#8892b0',
      })
      .setOrigin(0.5);
    const btn = this.add
      .text(640, 430, '▶ 시작', { fontFamily: 'sans-serif', fontSize: '40px', color: '#fff', backgroundColor: '#3a7bff', padding: { x: 36, y: 16 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('StageSelect'));
    const up = this.add
      .text(500, 530, '🔧 유닛 강화', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#ffd34d',
        backgroundColor: '#20304e',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    up.on('pointerdown', () => this.scene.start('Upgrade'));

    const reward = this.add
      .text(780, 530, '🎁 보상', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#5cff9e',
        backgroundColor: '#20304e',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    reward.on('pointerdown', () => this.openRewards());

    // 받을 게 있으면 뱃지 + 자동 오픈
    if (meta.canClaimDaily() || meta.pendingIdle() > 0) {
      const badge = this.add.circle(812, 512, 9, 0xff4d6a).setDepth(5);
      this.add.text(812, 512, '!', { fontFamily: 'sans-serif', fontSize: '14px', color: '#fff' }).setOrigin(0.5).setDepth(6);
      void badge;
      this.time.delayedCall(250, () => this.openRewards());
    }
  }

  private openRewards(): void {
    const layer = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.6).setInteractive();
    const panel = this.add.rectangle(640, 360, 560, 420, 0x182238).setStrokeStyle(3, 0x3a7bff);
    const title = this.add.text(640, 190, '🎁 보상', { fontFamily: 'sans-serif', fontSize: '36px', color: '#fff' }).setOrigin(0.5);
    const goldLbl = this.add.text(640, 236, `보유 골드 🪙 ${meta.gold}`, { fontFamily: 'sans-serif', fontSize: '20px', color: '#ffd34d' }).setOrigin(0.5);
    layer.add([dim, panel, title, goldLbl]);

    // 일일 보상
    const dailyY = 310;
    const dailyCard = this.add.rectangle(640, dailyY, 480, 90, 0x213458).setStrokeStyle(2, 0x2c4270);
    const dailyTitle = this.add.text(430, dailyY - 22, `📅 일일 출석 (연속 ${meta.streak + (meta.canClaimDaily() ? 1 : 0)}일)`, { fontFamily: 'sans-serif', fontSize: '18px', color: '#cfe0ff' }).setOrigin(0, 0.5);
    layer.add([dailyCard, dailyTitle]);

    const dailyBtn = this.add.text(760, dailyY, '', { fontFamily: 'sans-serif', fontSize: '20px', padding: { x: 16, y: 8 } }).setOrigin(0.5);
    const dailyDesc = this.add.text(430, dailyY + 16, '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#8ea0c0' }).setOrigin(0, 0.5);
    layer.add([dailyBtn, dailyDesc]);
    const refreshDaily = (): void => {
      if (meta.canClaimDaily()) {
        dailyDesc.setText('오늘 보상을 받으세요!');
        dailyBtn.setText('받기').setColor('#fff').setBackgroundColor('#2eae5a').setInteractive({ useHandCursor: true });
      } else {
        dailyDesc.setText('내일 또 오세요 ⏰');
        dailyBtn.setText('완료').setColor('#7c8aa0').setBackgroundColor('#2a3550').disableInteractive();
      }
    };
    dailyBtn.on('pointerdown', () => {
      const got = meta.claimDaily();
      if (got > 0) {
        this.floatGold(640, dailyY, got);
        goldLbl.setText(`보유 골드 🪙 ${meta.gold}`);
        dailyTitle.setText(`📅 일일 출석 (연속 ${meta.streak}일)`);
        refreshDaily();
      }
    });
    refreshDaily();

    // 방치 보상
    const idleY = 430;
    const idleCard = this.add.rectangle(640, idleY, 480, 90, 0x213458).setStrokeStyle(2, 0x2c4270);
    const idleTitle = this.add.text(430, idleY - 22, '💤 방치 보상 (최대 8시간)', { fontFamily: 'sans-serif', fontSize: '18px', color: '#cfe0ff' }).setOrigin(0, 0.5);
    layer.add([idleCard, idleTitle]);

    const idleBtn = this.add.text(760, idleY, '', { fontFamily: 'sans-serif', fontSize: '20px', padding: { x: 16, y: 8 } }).setOrigin(0.5);
    const idleDesc = this.add.text(430, idleY + 16, '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#8ea0c0' }).setOrigin(0, 0.5);
    layer.add([idleBtn, idleDesc]);
    const refreshIdle = (): void => {
      const pend = meta.pendingIdle();
      if (pend > 0) {
        idleDesc.setText(`그동안 모은 골드 🪙 ${pend}`);
        idleBtn.setText('받기').setColor('#fff').setBackgroundColor('#2eae5a').setInteractive({ useHandCursor: true });
      } else {
        idleDesc.setText('조금 더 기다리면 쌓여요');
        idleBtn.setText('0').setColor('#7c8aa0').setBackgroundColor('#2a3550').disableInteractive();
      }
    };
    idleBtn.on('pointerdown', () => {
      const got = meta.claimIdle();
      if (got > 0) {
        this.floatGold(640, idleY, got);
        goldLbl.setText(`보유 골드 🪙 ${meta.gold}`);
        refreshIdle();
      }
    });
    refreshIdle();

    const close = this.add.text(888, 174, '✕', { fontFamily: 'sans-serif', fontSize: '28px', color: '#fff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => layer.destroy());
    dim.on('pointerdown', () => layer.destroy());
    layer.add(close);
  }

  private floatGold(x: number, y: number, amount: number): void {
    const t = this.add.text(x, y, `+${amount} 🪙`, { fontFamily: 'sans-serif', fontSize: '26px', color: '#ffd34d' }).setOrigin(0.5).setDepth(110);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
}
