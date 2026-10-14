import Phaser from 'phaser';
import { meta } from '../systems/upgrades';
import { showRewarded } from '../systems/ads';
import { cuteButton, cuteTitle, drawSky } from '../ui/cute';
import { sfx } from '../systems/sound';

interface ResultData {
  win: boolean;
  stageId: number;
  earned: number;
  stars?: number; // 이번 판 별(0~3)
  prevStars?: number; // 이전 최고 별
  starGold?: number; // 새 별 보너스 골드
  mode?: 'endless'; // ♾️ 무한 모드 결과
  wave?: number;
  newBest?: boolean;
}

/** 결과 화면 — 별 평가 연출 + 보상 + 광고 2배 */
export class ResultScene extends Phaser.Scene {
  private resultData!: ResultData;
  constructor() {
    super('Result');
  }
  init(data: ResultData): void {
    this.resultData = { ...data, earned: data.earned ?? 0, stars: data.stars ?? 0, prevStars: data.prevStars ?? 0, starGold: data.starGold ?? 0 };
  }
  create(): void {
    if (this.resultData.mode === 'endless') {
      this.endlessResult();
      return;
    }
    const { win, earned, stars = 0, prevStars = 0, starGold = 0, stageId } = this.resultData;
    drawSky(this, { stars: win ? 18 : 4 });

    // 카드 패널
    const panel = this.add.graphics();
    panel.fillStyle(0x2a5fd0, 0.25).fillRoundedRect(340, 98, 600, 470, 36);
    panel.fillStyle(0xffffff, 0.92).fillRoundedRect(340, 90, 600, 470, 36);
    panel.lineStyle(5, win ? 0x5cd88a : 0xff7a8a, 1).strokeRoundedRect(340, 90, 600, 470, 36);

    const title = cuteTitle(this, 640, 150, win ? '🏆 승리!' : '💦 패배…', 60, win ? '#2fa25a' : '#d04a5a');
    title.setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 420, ease: 'Back.easeOut' });
    this.add
      .text(640, 210, `관문 ${stageId}`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#5a6a9a' })
      .setOrigin(0.5);

    // ⭐ 별 3개 — 하나씩 쿵 떨어지며 켜짐
    for (let i = 0; i < 3; i++) {
      const x = 640 + (i - 1) * 96;
      const y = 280 - (i === 1 ? 14 : 0);
      const on = i < stars;
      const empty = this.add.text(x, y, '★', { fontSize: '76px', color: '#d8dce6' }).setOrigin(0.5);
      void empty;
      if (!on) continue;
      const s = this.add
        .text(x, y, '★', { fontSize: '76px', color: '#ffc93a', stroke: '#c07a00', strokeThickness: 4 })
        .setOrigin(0.5)
        .setScale(2.4)
        .setAlpha(0);
      this.tweens.add({
        targets: s,
        scale: 1,
        alpha: 1,
        delay: 350 + i * 320,
        duration: 260,
        ease: 'Back.easeOut',
        onStart: () => sfx(this, 'coin', 2),
      });
      if (i >= prevStars) {
        // 새로 얻은 별 표시
        const nw = this.add
          .text(x, y + 46, 'NEW!', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ff4d6a' })
          .setOrigin(0.5)
          .setAlpha(0);
        this.tweens.add({ targets: nw, alpha: 1, delay: 700 + i * 320, duration: 200 });
      }
    }
    if (win) {
      const hint = stars >= 3 ? '완벽한 방어! 🎉' : '기지 체력을 더 지키면 별이 늘어요';
      this.add.text(640, 350, hint, { fontFamily: 'sans-serif', fontSize: '16px', color: '#7a86a8' }).setOrigin(0.5);
    }

    // 보상 요약
    const goldLine = this.add
      .text(640, 392, win ? `획득 골드 🪙 ${earned}` : '보상 없음', { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#e8a000' })
      .setOrigin(0.5);
    if (starGold > 0) {
      this.add
        .text(640, 426, `(새 별 보너스 +${starGold} 포함)`, { fontFamily: 'sans-serif', fontSize: '15px', color: '#c08a20' })
        .setOrigin(0.5);
    }
    this.add
      .text(640, 456, `보유 골드 🪙 ${meta.gold}   ·   총 별 ⭐ ${meta.totalStars}`, { fontFamily: 'sans-serif', fontSize: '17px', color: '#5a6a9a' })
      .setOrigin(0.5);

    // 📺 광고로 골드 2배 (승리 + 획득 골드 있을 때만)
    if (win && earned > 0) {
      let doubled = false;
      const dbl = cuteButton(this, 640, 510, 300, 50, '📺 광고 보고 골드 2배', 0xa07aff, 0x7a4ad8, '20px', () => {
        if (doubled) return;
        doubled = true;
        dbl.disableInteractive();
        label.setText('⏳ 광고…');
        void showRewarded().then((ok) => {
          if (ok) {
            meta.addGold(earned); // 추가 지급 = 2배
            goldLine.setText(`획득 골드 🪙 ${earned * 2} (2배!)`);
            label.setText('✅ 2배 완료');
            dbl.setAlpha(0.6);
            this.floatGold(640, 392, earned);
          } else {
            doubled = false;
            label.setText('📺 광고 보고 골드 2배');
            dbl.setInteractive({ useHandCursor: true });
          }
        });
      });
      const label = dbl.list[1] as Phaser.GameObjects.Text;
    }

    cuteButton(this, 480, 640, 220, 60, '🔄 다시', 0x4a8bff, 0x2a5fd0, '24px', () => this.scene.start('Battle', { stageId }));
    cuteButton(this, 800, 640, 260, 60, '🗺️ 스테이지 선택', 0x5cd88a, 0x2fa25a, '22px', () => this.scene.start('StageSelect'));
  }

  /** ♾️ 무한 모드 결과 — 버틴 웨이브 · 신기록 · 명예의 전당 */
  private endlessResult(): void {
    const { wave = 1, newBest, earned } = this.resultData;
    drawSky(this, { stars: newBest ? 24 : 8 });
    const panel = this.add.graphics();
    panel.fillStyle(0x6a4ad8, 0.3).fillRoundedRect(340, 98, 600, 470, 36);
    panel.fillStyle(0xffffff, 0.94).fillRoundedRect(340, 90, 600, 470, 36);
    panel.lineStyle(5, 0xa07aff, 1).strokeRoundedRect(340, 90, 600, 470, 36);

    const title = cuteTitle(this, 640, 150, `🌊 웨이브 ${wave} 도달!`, 50, '#6a4ad8');
    title.setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 420, ease: 'Back.easeOut' });
    if (newBest) {
      const nb = this.add
        .text(640, 208, '🎉 신기록! 🎉', { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ff4d8a' })
        .setOrigin(0.5);
      this.tweens.add({ targets: nb, scale: 1.12, duration: 380, yoyo: true, repeat: -1 });
    } else {
      this.add.text(640, 208, `최고 기록 🌊 ${meta.endlessBest}`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#7a6aa8' }).setOrigin(0.5);
    }

    // 🏆 명예의 전당
    this.add.text(640, 254, '🏆 명예의 전당', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#6a4ad8' }).setOrigin(0.5);
    const medal = ['🥇', '🥈', '🥉', '4', '5'];
    meta.endlessTop.forEach((r, i) => {
      const d = new Date(r.date);
      const isThis = newBest && i === 0 && r.wave === wave;
      this.add
        .text(640, 290 + i * 30, `${medal[i]}   웨이브 ${r.wave}   ·   ${d.getMonth() + 1}/${d.getDate()}`, {
          fontFamily: 'sans-serif',
          fontSize: '17px',
          fontStyle: isThis ? 'bold' : 'normal',
          color: isThis ? '#ff4d8a' : '#4a3a6a',
        })
        .setOrigin(0.5);
    });

    this.add.text(640, 460, `획득 골드 🪙 ${earned}`, { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#e8a000' }).setOrigin(0.5);
    this.add.text(640, 496, `보유 골드 🪙 ${meta.gold}`, { fontFamily: 'sans-serif', fontSize: '16px', color: '#5a6a9a' }).setOrigin(0.5);

    cuteButton(this, 480, 640, 220, 60, '🔄 다시', 0xa07aff, 0x7a4ad8, '24px', () => this.scene.start('Battle', { stageId: 0, mode: 'endless' }));
    cuteButton(this, 800, 640, 260, 60, '🗺️ 스테이지 선택', 0x5cd88a, 0x2fa25a, '22px', () => this.scene.start('StageSelect'));
  }

  private floatGold(x: number, y: number, amount: number): void {
    const t = this.add.text(x, y - 30, `+${amount} 🪙`, { fontFamily: 'sans-serif', fontSize: '26px', color: '#e8a000', stroke: '#fff', strokeThickness: 4 }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
  }
}
