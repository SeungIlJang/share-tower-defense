import Phaser from 'phaser';
import { meta } from '../systems/upgrades';
import { showRewarded } from '../systems/ads';
import { cuteButton, cuteTitle, drawSky } from '../ui/cute';
import { sfx } from '../systems/sound';
import unitsData from '../data/units.json';
import type { UnitStats } from '../types';
import { formatTime, nextUnitToBuy } from '../systems/pacing';
import { unitPrice } from '../systems/unlocks';
import { iconKey } from '../systems/sprites';
import { unlockedBy } from '../systems/tutorial';
import type { ChestLoot } from '../systems/chests';
import { chestCard, chestPopup } from '../ui/Chest';
import { grantNewChest } from '../systems/chestGrant';
import { goldMultFor } from '../systems/worlds';
import { WEEKLY_STEPS } from '../systems/weekly';
import enemiesData from '../data/enemies.json';

const ENEMY_NAMES = enemiesData as Record<string, { name: string }>;

const UNITS = unitsData as Record<string, UnitStats>;

interface ResultData {
  win: boolean;
  stageId: number;
  earned: number;
  stars?: number; // 이번 판 별(0~3)
  prevStars?: number; // 이전 최고 별
  starGold?: number; // 새 별 보너스 골드
  mode?: 'endless' | 'daily' | 'weekly'; // ♾️ 무한 모드 · 📅 오늘의 도전 · 👑 주간 보스 결과
  weekly?: { boss: string; units: number; before: number; after: number; steps: number[] }; // 👑 이번 판 피해·누적(보스 체력 배수)·새 단계
  dailyBonus?: number; // 📅 하루 첫 승리 보너스(0 = 이미 받음)
  ruleName?: string;
  wave?: number;
  newBest?: boolean;
  time?: number; // ⏱️ 클리어 시간(초)
  timeRec?: 'first' | 'best' | null; // 첫 기록 / 신기록
  prevCleared?: number; // 🎓 이번 판 전 클리어 최고 관문
  chest?: ChestLoot | null; // 🎁 보물 상자(이미 지급됨 — 여는 연출만)
  target?: number | null; // ⏱️ 목표 시간(초)
  targetGold?: number; // 목표 시간 보너스(이미 지급됨)
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
    if (this.resultData.mode === 'weekly') {
      this.weeklyResult();
      return;
    }
    const { win, earned, stars = 0, prevStars = 0, starGold = 0, stageId } = this.resultData;
    const daily = this.resultData.mode === 'daily';
    drawSky(this, { stars: win ? 18 : 4 });

    // 카드 패널
    const panel = this.add.graphics();
    panel.fillStyle(0x2a5fd0, 0.25).fillRoundedRect(340, 98, 600, 470, 36);
    panel.fillStyle(0xffffff, 0.92).fillRoundedRect(340, 90, 600, 470, 36);
    panel.lineStyle(5, win ? 0x5cd88a : 0xff7a8a, 1).strokeRoundedRect(340, 90, 600, 470, 36);

    const title = cuteTitle(this, 640, 150, win ? '🏆 승리!' : '💦 패배…', 60, win ? '#2fa25a' : '#d04a5a');
    title.setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 420, ease: 'Back.easeOut' });
    // 관문 · ⏱️ 클리어 시간(+ 최고 기록 / 신기록)
    const { time, timeRec } = this.resultData;
    const best = meta.bestTimes[stageId];
    const timeTxt = win && time !== undefined ? `   ·   ⏱️ ${formatTime(time)}${timeRec ? '' : `  (최고 ${formatTime(best ?? time)})`}` : '';
    this.add
      .text(640, 210, daily ? `📅 오늘의 도전 · ${this.resultData.ruleName ?? ''}` : `관문 ${stageId}${timeTxt}`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#5a6a9a' })
      .setOrigin(0.5);
    if (timeRec === 'best') {
      const nb = this.add
        .text(860, 186, '🏆 신기록!', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ff4d6a', stroke: '#ffffff', strokeThickness: 4 })
        .setOrigin(0.5)
        .setAngle(8);
      this.tweens.add({ targets: nb, scale: 1.15, duration: 380, yoyo: true, repeat: -1 });
    }
    this.nextUnitCard();
    if (this.resultData.chest) {
      chestCard(this, 170, 330, this.resultData.chest, (k) => UNITS[k]?.name ?? k);
      this.adChest(this.resultData.chest.tier, daily ? 1 : goldMultFor(stageId));
    }

    // ⭐ 별 3개 — 하나씩 쿵 떨어지며 켜짐
    for (let i = 0; i < (daily ? 0 : 3); i++) {
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
    const unlock = win ? unlockedBy(stageId, this.resultData.prevCleared ?? stageId) : null;
    if (daily) {
      const b = this.resultData.dailyBonus ?? 0;
      this.add
        .text(640, 300, !win ? '내일 규칙이 바뀌기 전에 다시 도전!' : b > 0 ? `🎉 오늘의 첫 승리 보너스 🪙 +${b}` : '오늘 보너스는 이미 받았어요 · 내일 새 도전!', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: b > 0 ? '#ff7a2a' : '#7a86a8' })
        .setOrigin(0.5);
    } else if (unlock) {
      // 🎓 다음 관문에서 열리는 기능 — "조금만 더" 하게
      const u = this.add
        .text(640, 350, `🔓 다음 관문에서 ${unlock.name} 해금!`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ff7a2a', stroke: '#ffffff', strokeThickness: 4 })
        .setOrigin(0.5);
      this.tweens.add({ targets: u, scale: 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    } else if (win) {
      const hint = stars >= 3 ? '완벽한 방어! 🎉' : '기지 체력을 더 지키면 별이 늘어요';
      this.add.text(640, 350, hint, { fontFamily: 'sans-serif', fontSize: '16px', color: '#7a86a8' }).setOrigin(0.5);
    }

    // 보상 요약
    const goldLine = this.add
      .text(640, 392, win ? `획득 골드 🪙 ${earned}` : '보상 없음', { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#e8a000' })
      .setOrigin(0.5);
    // 새 별 보너스 · ⏱️ 목표 시간(달성하면 보너스 — 따로 지급됨)
    const { target, targetGold = 0 } = this.resultData;
    const notes: string[] = [];
    if (starGold > 0) notes.push(`새 별 보너스 +${starGold} 포함`);
    if (win && !daily && target) notes.push(targetGold > 0 ? `⏱️ 목표 ${formatTime(target)} 달성! +${targetGold}` : `⏱️ 목표 ${formatTime(target)} — 다음엔 더 빨리!`);
    if (notes.length) {
      this.add
        .text(640, 426, notes.join('   ·   '), { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: targetGold > 0 ? 'bold' : 'normal', color: targetGold > 0 ? '#2fa25a' : '#c08a20' })
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

    cuteButton(this, 480, 640, 220, 60, '🔄 다시', 0x4a8bff, 0x2a5fd0, '24px', () => this.scene.start('Battle', { stageId, mode: daily ? 'daily' : undefined }));
    cuteButton(this, 800, 640, 260, 60, '🗺️ 스테이지 선택', 0x5cd88a, 0x2fa25a, '22px', () => this.scene.start('StageSelect'));
  }

  /** 🔜 다음에 살 수 있는 유닛 미리보기(오른쪽 카드) → 강화 화면으로 */
  private nextUnitCard(): void {
    const keys = Object.keys(UNITS);
    const next = nextUnitToBuy(keys, (k) => meta.ownsUnit(k));
    if (!next) return;
    const price = unitPrice(next.index);
    const x = 1110;
    const y = 330;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.92).fillRoundedRect(x - 130, y - 150, 260, 300, 28);
    g.lineStyle(4, 0xffb02e, 1).strokeRoundedRect(x - 130, y - 150, 260, 300, 28);
    this.add.text(x, y - 120, '🔜 다음 동료', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#d8862a' }).setOrigin(0.5);
    if (this.textures.exists(iconKey(next.key))) {
      const face = this.add.image(x, y - 32, iconKey(next.key)).setDisplaySize(110, 110);
      this.tweens.add({ targets: face, y: y - 40, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    this.add.text(x, y + 44, UNITS[next.key].name, { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#3a3a5a' }).setOrigin(0.5);
    const can = meta.gold >= price;
    this.add
      .text(x, y + 78, can ? `🪙 ${price} — 지금 살 수 있어요!` : `🪙 ${price} (${price - meta.gold} 부족)`, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: can ? '#2fa25a' : '#9a7a40' })
      .setOrigin(0.5);
    cuteButton(this, x, y + 118, 200, 42, '🛒 강화에서 구매', can ? 0xffb02e : 0xc0c8d0, can ? 0xd8862a : 0x9098a8, '17px', () => this.scene.start('Upgrade'));
  }

  /** ♾️ 무한 모드 결과 — 버틴 웨이브 · 신기록 · 명예의 전당 */
  /** 👑 주간 보스 결과 — 이번 판 피해 · 이번 주 누적 · 단계 5칸 · 새 단계 보상 */
  private weeklyResult(): void {
    const w = this.resultData.weekly ?? { boss: '', units: 0, before: 0, after: 0, steps: [] };
    const { earned } = this.resultData;
    drawSky(this, { stars: w.steps.length ? 20 : 6 });
    const panel = this.add.graphics();
    panel.fillStyle(0xc03a4e, 0.3).fillRoundedRect(340, 98, 600, 470, 36);
    panel.fillStyle(0xffffff, 0.95).fillRoundedRect(340, 90, 600, 470, 36);
    panel.lineStyle(5, 0xff5a6e, 1).strokeRoundedRect(340, 90, 600, 470, 36);
    const name = ENEMY_NAMES[w.boss]?.name ?? '보스';
    const title = cuteTitle(this, 640, 146, `👑 ${name}`, 46, '#c03a4e');
    title.setScale(0.3);
    this.tweens.add({ targets: title, scale: 1, duration: 420, ease: 'Back.easeOut' });
    this.add.text(640, 204, `이번 판 피해  💥 보스 체력 ×${w.units.toFixed(2)}`, { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#3a2a4a' }).setOrigin(0.5);
    this.add.text(640, 240, `이번 주 누적  ×${w.before.toFixed(2)} → ×${w.after.toFixed(2)}`, { fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#8a5a6a' }).setOrigin(0.5);
    // 단계 5칸
    const done = WEEKLY_STEPS.filter((st) => w.after >= st.need).length;
    WEEKLY_STEPS.forEach((st, i) => {
      const x = 640 + (i - 2) * 108;
      const on = i < done;
      const fresh = w.steps.includes(i);
      const c = this.add.container(x, 318);
      c.add(this.add.circle(0, 0, 40, on ? 0xffd34d : 0xeef0f4).setStrokeStyle(4, fresh ? 0xff4d6a : on ? 0xe8a000 : 0xd0d4dc));
      c.add(this.add.text(0, -10, on ? '✅' : `${i + 1}`, { fontFamily: 'sans-serif', fontSize: on ? '24px' : '22px', fontStyle: 'bold', color: '#6a5a3a' }).setOrigin(0.5));
      c.add(this.add.text(0, 18, `×${st.need}`, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#6a5a3a' }).setOrigin(0.5));
      c.add(this.add.text(0, 58, `🪙${st.gold}${st.chest !== null ? ' 🎁' : ''}`, { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#8a7a5a' }).setOrigin(0.5));
      if (fresh) {
        c.setScale(0.3);
        this.tweens.add({ targets: c, scale: 1, delay: 300 + i * 200, duration: 300, ease: 'Back.easeOut', onStart: () => sfx(this, 'coin') });
      }
    });
    this.add
      .text(640, 420, w.steps.length ? `🎉 새 단계 ${w.steps.length}개 달성!` : done >= WEEKLY_STEPS.length ? '✅ 이번 주 모든 단계 달성!' : `다음 단계까지 ×${(WEEKLY_STEPS[done].need - w.after).toFixed(2)} — 다시 도전해 쌓아요`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: w.steps.length ? '#2fa25a' : '#8a6a7a' })
      .setOrigin(0.5);
    this.add.text(640, 466, `획득 골드 🪙 ${earned}`, { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#e8a000' }).setOrigin(0.5);
    this.add.text(640, 502, `보유 골드 🪙 ${meta.gold}   ·   보스는 매주 월요일에 바뀌어요`, { fontFamily: 'sans-serif', fontSize: '15px', color: '#5a6a9a' }).setOrigin(0.5);
    if (this.resultData.chest) {
      chestCard(this, 170, 330, this.resultData.chest, (k) => UNITS[k]?.name ?? k);
      this.adChest(this.resultData.chest.tier, goldMultFor(this.resultData.stageId));
    }
    cuteButton(this, 480, 640, 220, 60, '🔄 다시', 0xff5a6e, 0xc03a4e, '24px', () => this.scene.start('Battle', { stageId: 0, mode: 'weekly' }));
    cuteButton(this, 800, 640, 260, 60, '🗺️ 스테이지 선택', 0x5cd88a, 0x2fa25a, '22px', () => this.scene.start('StageSelect'));
  }

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

    if (this.resultData.chest) {
      chestCard(this, 170, 330, this.resultData.chest, (k) => UNITS[k]?.name ?? k);
      this.adChest(this.resultData.chest.tier, 1);
    }
    cuteButton(this, 480, 640, 220, 60, '🔄 다시', 0xa07aff, 0x7a4ad8, '24px', () => this.scene.start('Battle', { stageId: 0, mode: 'endless' }));
    cuteButton(this, 800, 640, 260, 60, '🗺️ 스테이지 선택', 0x5cd88a, 0x2fa25a, '22px', () => this.scene.start('StageSelect'));
  }

  /** 📺 광고 보고 같은 등급 상자 하나 더(결과 화면마다 1번) */
  private adChest(tier: ChestLoot['tier'], goldMult: number): void {
    let busy = false;
    const b = cuteButton(this, 170, 514, 250, 44, '📺 광고 보고 상자 하나 더', 0xffb02e, 0xd8862a, '17px', () => {
      if (busy) return;
      busy = true;
      b.disableInteractive();
      label.setText('⏳ 광고…');
      void showRewarded().then((ok) => {
        if (!ok) {
          busy = false;
          label.setText('📺 광고 보고 상자 하나 더');
          b.setInteractive({ useHandCursor: true });
          return;
        }
        label.setText('✅ 받았어요');
        b.setAlpha(0.6);
        chestPopup(this, grantNewChest(tier, goldMult), (k) => UNITS[k]?.name ?? k);
      });
    });
    const label = b.list[1] as Phaser.GameObjects.Text;
  }

  private floatGold(x: number, y: number, amount: number): void {
    const t = this.add.text(x, y - 30, `+${amount} 🪙`, { fontFamily: 'sans-serif', fontSize: '26px', color: '#e8a000', stroke: '#fff', strokeThickness: 4 }).setOrigin(0.5).setDepth(50);
    this.tweens.add({ targets: t, y: y - 90, alpha: 0, duration: 1000, onComplete: () => t.destroy() });
  }
}
