import Phaser from 'phaser';
import { meta } from '../systems/upgrades';
import { animKey, spriteOf, textureKey } from '../systems/sprites';

/** 메인 화면 행진에 나오는 아군(오른쪽으로) / 적(왼쪽으로) */
const PARADE_ALLY = ['knight', 'soldier', 'archer', 'cleric', 'mage', 'spear'];
const PARADE_ENEMY = ['slime', 'goblin', 'mushroom', 'ghost'];
const GROUND_Y = 640;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.drawBackground();
    this.drawParade();
    this.drawTitle();

    // 버튼
    this.cuteButton(640, 420, 260, 78, '▶  시작', 0x4a8bff, 0x2a5fd0, '34px', () => this.scene.start('StageSelect'));
    this.cuteButton(520, 520, 200, 58, '🔧 강화', 0xffc94a, 0xd8962a, '24px', () => this.scene.start('Upgrade'));
    const reward = this.cuteButton(760, 520, 200, 58, '🎁 보상', 0x5cd88a, 0x2fa25a, '24px', () => this.openRewards());

    // 받을 게 있으면 뱃지 + 자동 오픈
    if (meta.canClaimDaily() || meta.pendingIdle() > 0) {
      const bx = reward.x + 88;
      const by = reward.y - 26;
      const badge = this.add.container(bx, by, [
        this.add.circle(0, 0, 13, 0xff4d6a).setStrokeStyle(3, 0xffffff),
        this.add.text(0, 0, '!', { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5),
      ]).setDepth(30);
      this.tweens.add({ targets: badge, scale: 1.2, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.time.delayedCall(250, () => this.openRewards());
    }
  }

  /** 하늘 그라데이션 + 구름 + 반짝이 + 언덕 풀밭 */
  private drawBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x7fd3ff, 0x7fd3ff, 0xd8f2ff, 0xd8f2ff, 1);
    g.fillRect(0, 0, 1280, 720);
    // 먼 언덕
    g.fillStyle(0x9fe08a, 1);
    g.fillEllipse(260, 640, 900, 260);
    g.fillEllipse(1040, 650, 900, 240);
    // 앞 풀밭
    g.fillStyle(0x6cc35a, 1);
    g.fillRect(0, GROUND_Y - 6, 1280, 90);
    g.fillStyle(0x58ab48, 1);
    g.fillRect(0, GROUND_Y + 34, 1280, 50);
    // 풀 무늬
    g.fillStyle(0x86d873, 1);
    for (let x = 10; x < 1280; x += 46) g.fillTriangle(x, GROUND_Y - 6, x + 8, GROUND_Y - 18, x + 16, GROUND_Y - 6);

    // 둥실 구름
    const cloud = (x: number, y: number, s: number, speed: number): void => {
      const c = this.add.container(x, y);
      c.add([
        this.add.ellipse(0, 0, 120 * s, 46 * s, 0xffffff),
        this.add.ellipse(-36 * s, 6 * s, 70 * s, 36 * s, 0xffffff),
        this.add.ellipse(38 * s, 8 * s, 80 * s, 34 * s, 0xffffff),
        this.add.ellipse(6 * s, -16 * s, 70 * s, 44 * s, 0xffffff),
      ]);
      c.setAlpha(0.9);
      this.tweens.add({ targets: c, x: x + 1500, duration: speed, repeat: -1, onRepeat: () => (c.x = -160) });
      c.x = x;
    };
    cloud(160, 110, 1, 70000);
    cloud(760, 70, 0.7, 90000);
    cloud(1100, 170, 0.9, 80000);
    cloud(420, 250, 0.6, 100000);

    // 반짝이 별
    for (let i = 0; i < 18; i++) {
      const s = this.add
        .text(Phaser.Math.Between(30, 1250), Phaser.Math.Between(20, 360), '✦', { fontSize: `${Phaser.Math.Between(12, 22)}px`, color: '#ffffff' })
        .setOrigin(0.5)
        .setAlpha(0);
      this.tweens.add({ targets: s, alpha: 0.9, duration: 900, yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2500), hold: 300 });
    }
  }

  /** 양쪽 기지 + 걸어가는 캐릭터들 */
  private drawParade(): void {
    const base = (key: string, x: number): void => {
      const d = spriteOf(key);
      if (!d || !this.textures.exists(textureKey(key))) return;
      this.add.sprite(x, GROUND_Y + 4, textureKey(key), d.anims.idle!.frames[0]).setOrigin(0.5, 1).setScale(d.scale * 1.15);
    };
    base('base_ally', 90);
    base('base_enemy', 1190);

    const walker = (type: string, fromX: number, toX: number, delay: number, faceLeft: boolean): void => {
      const d = spriteOf(type);
      if (!d || !this.textures.exists(textureKey(type))) return;
      const y = GROUND_Y + 6;
      const s = this.add
        .sprite(fromX, y, textureKey(type), d.anims.idle!.frames[0])
        .setOrigin(0.5, d.footY / d.frameHeight)
        .setScale(d.scale * 1.1)
        .setFlipX(faceLeft);
      const shadow = this.add.ellipse(fromX, y + 2, d.frameWidth * d.scale * 0.6, 8, 0x000000, 0.18);
      s.play(animKey(type, d.anims.walk ? 'walk' : 'idle'));
      const dur = Math.abs(toX - fromX) * 26;
      this.tweens.add({
        targets: [s, shadow],
        x: toX,
        duration: dur,
        delay,
        repeat: -1,
        onRepeat: () => {
          s.x = fromX;
          shadow.x = fromX;
        },
      });
    };
    PARADE_ALLY.forEach((t, i) => walker(t, -60, 1340, i * 2600, false));
    PARADE_ENEMY.forEach((t, i) => walker(t, 1340, -60, 1300 + i * 3800, true));
  }

  /** 통통 튀는 제목 + 부제 */
  private drawTitle(): void {
    const title = this.add
      .text(640, 190, '모두의 타워디펜스', {
        fontFamily: 'sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#3a5bd8',
        strokeThickness: 12,
        shadow: { offsetX: 0, offsetY: 7, color: '#1f2f80', blur: 0, fill: true, stroke: true },
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: title, y: 180, scaleX: 1.03, scaleY: 1.03, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const sub = this.add
      .text(640, 278, '⚔️  12명의 영웅과 함께 마을을 지켜요!  🛡️', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#3a4a8a',
        backgroundColor: '#ffffffcc',
        padding: { x: 18, y: 7 },
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: sub, angle: { from: -1.2, to: 1.2 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  /** 둥근 말랑 버튼 — 아래 그림자 + 누르면 쏙 들어감 */
  private cuteButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    dark: number,
    fontSize: string,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const r = h / 2;
    const g = this.add.graphics();
    const draw = (pressed: boolean): void => {
      g.clear();
      g.fillStyle(dark, 1).fillRoundedRect(-w / 2, -h / 2 + 6, w, h, r);
      g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2 + (pressed ? 5 : 0), w, h, r);
      g.fillStyle(0xffffff, 0.28).fillRoundedRect(-w / 2 + 14, -h / 2 + (pressed ? 9 : 4), w - 28, h * 0.32, r * 0.5);
      g.lineStyle(3, 0xffffff, 0.9).strokeRoundedRect(-w / 2, -h / 2 + (pressed ? 5 : 0), w, h, r);
    };
    draw(false);
    const text = this.add
      .text(0, 0, label, { fontFamily: 'sans-serif', fontSize, fontStyle: 'bold', color: '#ffffff', stroke: '#00000055', strokeThickness: 4 })
      .setOrigin(0.5);
    const c = this.add.container(x, y, [g, text]).setDepth(20).setSize(w, h + 6);
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => this.tweens.add({ targets: c, scale: 1.06, duration: 120 }));
    c.on('pointerout', () => {
      draw(false);
      text.y = 0;
      this.tweens.add({ targets: c, scale: 1, duration: 120 });
    });
    c.on('pointerdown', () => {
      draw(true);
      text.y = 5;
    });
    c.on('pointerup', () => {
      draw(false);
      text.y = 0;
      onClick();
    });
    return c;
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
