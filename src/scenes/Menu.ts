import Phaser from 'phaser';
import { dailyAmount, meta } from '../systems/upgrades';
import { animKey, spriteOf, textureKey } from '../systems/sprites';
import { bgm, sfx } from '../systems/sound';
import { ACHIEVEMENTS, missionText, type Mission } from '../systems/missions';
import { GROUND_Y, cuteButton, drawSky } from '../ui/cute';
import { openKeypad } from '../ui/Keypad';
import { DEV_PIN_LEN, checkDevPin } from '../systems/dev';
import { VIEW_W } from '../systems/view';
import { TITLES, titleName } from '../systems/titles';
import { hideBanner, showMenuBanner, showRewarded } from '../systems/ads';
import { grantNewChest } from '../systems/chestGrant';
import { goldMultFor } from '../systems/worlds';
import { chestPopup } from '../ui/Chest';
import unitsData from '../data/units.json';

/** 메인 화면 행진에 나오는 아군(오른쪽으로) / 적(왼쪽으로) */
const PARADE_ALLY = ['knight', 'soldier', 'archer', 'cleric', 'mage', 'spear'];
const PARADE_ENEMY = ['slime', 'goblin', 'mushroom', 'ghost'];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.chip = null;
    this.chipDot = null;
    drawSky(this);
    bgm(this, 'bgm_menu');
    this.drawParade();
    this.drawTitle();

    // 버튼
    cuteButton(this, 640, 420, 260, 78, '▶  시작', 0x4a8bff, 0x2a5fd0, '34px', () => this.scene.start('StageSelect'));
    cuteButton(this, 310, 520, 200, 58, '🔧 강화', 0xffc94a, 0xd8962a, '24px', () => this.scene.start('Upgrade'));
    const reward = cuteButton(this, 530, 520, 200, 58, '🎁 보상', 0x5cd88a, 0x2fa25a, '24px', () => this.openRewards());
    const mission = cuteButton(this, 750, 520, 200, 58, '📋 미션', 0xff8ab0, 0xd85a88, '24px', () => this.openMissions('daily'));
    const codex = cuteButton(this, 970, 520, 200, 58, '📖 도감', 0x7a9aff, 0x4a6ad8, '24px', () => this.scene.start('Codex'));
    if (meta.hasCodexClaim()) this.badge(codex);

    // 받을 게 있으면 뱃지(+ 보상은 자동 오픈)
    this.titleChip();
    void showMenuBanner(); // 🪧 메인 화면 하단 배너(다른 화면으로 가면 치움)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => void hideBanner());
    if (meta.canClaimDaily() || meta.pendingIdle() > 0 || meta.canFreeChest()) this.badge(reward);
    if (meta.canClaimDaily() || meta.pendingIdle() > 0) {
      this.time.delayedCall(250, () => this.openRewards());
    }
    if (meta.hasClaimable(ACHIEVEMENTS)) this.badge(mission);
  }

  /** 🛠️ 개발자 모드 비밀번호(숫자 키패드) */
  private askDevPin(): void {
    const kp = openKeypad(this, { title: '🛠️ 개발자 모드', mask: true, maxLen: DEV_PIN_LEN, hint: '비밀번호를 입력하세요' }, (pin) => {
      void checkDevPin(pin).then((ok) => {
        if (ok) {
          kp.close();
          this.scene.start('Dev');
        } else kp.shake('비밀번호가 틀렸어요');
      });
    });
  }

  private badge(btn: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
    const badge = this.add
      .container(btn.x + 88, btn.y - 26, [
        this.add.circle(0, 0, 13, 0xff4d6a).setStrokeStyle(3, 0xffffff),
        this.add.text(0, 0, '!', { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5),
      ])
      .setDepth(30);
    this.tweens.add({ targets: badge, scale: 1.2, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return badge;
  }

  /** 📋 미션 창 — [오늘의 미션] 3개 / [업적] 목록, 진행 막대 + 받기 */
  private openMissions(tab: 'daily' | 'ach', page = 0): void {
    const layer = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.45).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0xd85a88, 0.35).fillRoundedRect(330, 66, 620, 600, 34);
    g.fillStyle(0xffffff, 0.97).fillRoundedRect(330, 58, 620, 600, 34);
    g.lineStyle(5, 0xff8ab0, 1).strokeRoundedRect(330, 58, 620, 600, 34);
    layer.add([dim, g]);
    layer.add(this.add.text(640, 100, '📋 미션', { fontFamily: 'sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#d85a88' }).setOrigin(0.5));
    const goldLbl = this.add.text(640, 136, `보유 🪙 ${meta.gold}`, { fontFamily: 'sans-serif', fontSize: '17px', color: '#a07a20' }).setOrigin(0.5);
    layer.add(goldLbl);

    // 탭
    (
      [
        ['daily', '☀️ 오늘의 미션', 530],
        ['ach', '🏅 업적', 750],
      ] as const
    ).forEach(([key, label, x]) => {
      const on = key === tab;
      const t = this.add
        .text(x, 176, label, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: on ? '#ffffff' : '#a06a80', backgroundColor: on ? '#ff8ab0' : '#fde6ef', padding: { x: 16, y: 7 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        layer.destroy();
        this.openMissions(key);
      });
      layer.add(t);
    });

    // 🏅 업적은 받을 것 → 진행 중 → 완료 순, 한 쪽에 7개씩
    const PER = 7;
    const order = (m: Mission): number => (meta.isClaimed(m, 'ach') ? 2 : meta.progress(m, 'ach') >= m.goal ? 0 : 1);
    const all = tab === 'daily' ? meta.todayMissions() : [...ACHIEVEMENTS].sort((a, b) => order(a) - order(b));
    const pages = Math.max(1, Math.ceil(all.length / PER));
    const pg = Math.min(page, pages - 1);
    const list: Mission[] = tab === 'daily' ? all : all.slice(pg * PER, pg * PER + PER);
    if (tab === 'ach' && pages > 1) {
      const nav = (x: number, label: string, to: number): void => {
        const t = this.add
          .text(x, 628, label, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: to < 0 || to >= pages ? '#d0c0c8' : '#d85a88', padding: { x: 10, y: 4 } })
          .setOrigin(0.5);
        if (to >= 0 && to < pages)
          t.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            layer.destroy();
            this.openMissions('ach', to);
          });
        layer.add(t);
      };
      nav(560, '◀', pg - 1);
      layer.add(this.add.text(640, 628, `${pg + 1} / ${pages}`, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#8a7a90' }).setOrigin(0.5));
      nav(720, '▶', pg + 1);
    }
    const rowH = tab === 'daily' ? 96 : 52;
    list.forEach((m, i) => {
      const y = 232 + rowH / 2 + i * rowH;
      const p = meta.progress(m, tab);
      const done = p >= m.goal;
      const claimed = meta.isClaimed(m, tab);
      const rg = this.add.graphics();
      rg.fillStyle(claimed ? 0xf0f0f4 : 0xfff6fa, 1).fillRoundedRect(356, y - rowH / 2 + 4, 568, rowH - 8, 14);
      // 진행 막대
      const bw = 300;
      rg.fillStyle(0xf2d6e2, 1).fillRoundedRect(372, y + (tab === 'daily' ? 10 : 6), bw, 10, 5);
      rg.fillStyle(done ? 0x5cd88a : 0xff8ab0, 1).fillRoundedRect(372, y + (tab === 'daily' ? 10 : 6), Math.max(10, (bw * p) / m.goal), 10, 5);
      layer.add(rg);
      layer.add(
        this.add
          .text(372, y - (tab === 'daily' ? 14 : 10), missionText(m), { fontFamily: 'sans-serif', fontSize: tab === 'daily' ? '20px' : '16px', fontStyle: 'bold', color: claimed ? '#a0a8b8' : '#4a3a5a' })
          .setOrigin(0, 0.5)
      );
      layer.add(
        this.add
          .text(372 + bw + 10, y + (tab === 'daily' ? 15 : 11), `${p} / ${m.goal}`, { fontFamily: 'sans-serif', fontSize: '13px', color: '#8a7a90' })
          .setOrigin(0, 0.5)
      );
      const label = claimed ? '✅ 완료' : done ? `받기 🪙${m.reward}` : `🪙${m.reward}`;
      const btn = this.add
        .text(860, y, label, {
          fontFamily: 'sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          color: '#ffffff',
          backgroundColor: claimed ? '#c0c4d0' : done ? '#2fa25a' : '#d0b0c0',
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5);
      if (done && !claimed) {
        btn.setInteractive({ useHandCursor: true });
        this.tweens.add({ targets: btn, scale: 1.08, duration: 400, yoyo: true, repeat: -1 });
        btn.on('pointerdown', () => {
          const got = meta.claimMission(m, tab);
          if (got > 0) {
            sfx(this, 'coin', 2);
            this.floatGold(860, y, got);
            layer.destroy();
            this.openMissions(tab, pg);
          }
        });
      }
      layer.add(btn);
    });
    if (tab === 'daily') {
      layer.add(this.add.text(640, 560, '매일 자정에 새 미션으로 바뀌어요', { fontFamily: 'sans-serif', fontSize: '14px', color: '#a090a0' }).setOrigin(0.5));
    }

    const close = this.add.text(918, 92, '✕', { fontFamily: 'sans-serif', fontSize: '30px', color: '#d85a88' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => layer.destroy());
    dim.on('pointerdown', () => layer.destroy());
    layer.add(close);
  }

  /** 양쪽 기지 + 걸어가는 캐릭터들 */
  private drawParade(): void {
    const base = (key: string, x: number): Phaser.GameObjects.Sprite | null => {
      const d = spriteOf(key);
      if (!d || !this.textures.exists(textureKey(key))) return null;
      return this.add.sprite(x, GROUND_Y + 4, textureKey(key), d.anims.idle!.frames[0]).setOrigin(0.5, 1).setScale(d.scale * 1.15);
    };
    // 🛠️ 우리 성을 누르면 비밀번호 → 개발자 모드
    base('base_ally', 90)?.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.askDevPin());
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

  /** 🏷️ 칭호 — 왼쪽 위 이름표(새 칭호면 빨간 점), 누르면 고르기 */
  private chip: Phaser.GameObjects.Container | null = null;
  private chipDot: Phaser.GameObjects.Container | null = null;

  private titleChip(): void {
    this.chip?.destroy();
    this.chipDot?.destroy();
    this.chipDot = null;
    const name = titleName(meta.title);
    const has = meta.titles.length > 0;
    const chip = cuteButton(this, 150, 40, 250, 46, name ?? (has ? '🏷️ 칭호 달기' : '🏷️ 칭호'), 0xffffff, 0xc8d0e0, name ? '19px' : '20px', () => this.openTitles());
    (chip.list[1] as Phaser.GameObjects.Text).setColor('#4a3a8a');
    if (meta.newTitles.length) this.chipDot = this.badge(chip);
    this.chip = chip;
  }

  private openTitles(): void {
    meta.markTitlesSeen();
    const layer = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.45).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.97).fillRoundedRect(140, 30, 1000, 660, 36);
    g.lineStyle(6, 0xa07aff, 1).strokeRoundedRect(140, 30, 1000, 660, 36);
    layer.add([dim, g, this.add.text(640, 76, '🏷️ 칭호', { fontFamily: 'sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#7a4ad8' }).setOrigin(0.5)]);
    layer.add(this.add.text(640, 116, `${meta.titles.length} / ${TITLES.length}  ·  얻은 칭호를 눌러 달아요`, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#8a7aa8' }).setOrigin(0.5));
    const earned = new Set(meta.titles);
    TITLES.forEach((t, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 320 + col * 320;
      const y = 172 + row * 92;
      const on = earned.has(t.key);
      const cur = meta.title === t.key;
      const c = this.add.container(x, y);
      const bg = this.add.graphics();
      bg.fillStyle(cur ? 0xffd34d : on ? 0xf0e8ff : 0xeef0f4, 1).fillRoundedRect(-148, -38, 296, 76, 18);
      bg.lineStyle(3, cur ? 0xe8a000 : on ? 0xa07aff : 0xd0d4dc, 1).strokeRoundedRect(-148, -38, 296, 76, 18);
      c.add(bg);
      c.add(this.add.text(0, -12, on ? t.name : `🔒 ${t.name.replace(/^\S+\s/, '')}`, { fontFamily: 'sans-serif', fontSize: '21px', fontStyle: 'bold', color: on ? '#3a2a6a' : '#9aa0b0' }).setOrigin(0.5));
      c.add(this.add.text(0, 18, cur ? '✔ 달고 있어요' : t.how, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: cur ? '#8a5a00' : '#8a92a8' }).setOrigin(0.5));
      if (on) {
        const hit = this.add.rectangle(0, 0, 296, 76, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          meta.setTitle(cur ? null : t.key);
          sfx(this, 'click');
          layer.destroy();
          this.titleChip();
        });
        c.add(hit);
      }
      layer.add(c);
    });
    const close = this.add.text(1100, 70, '✕', { fontFamily: 'sans-serif', fontSize: '40px', fontStyle: 'bold', color: '#7a4ad8', padding: { x: 10, y: 4 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const shut = (): void => {
      layer.destroy();
      this.titleChip(); // 이름표 새로 그림(새 칭호 점 끔)
    };
    close.on('pointerdown', shut);
    dim.on('pointerdown', shut);
    layer.add(close);
  }

  /** 🎁 보상 창 — 일일 출석(7일 달력) + 방치 보상, 미션 창과 같은 귀여운 카드 */
  private openRewards(): void {
    const layer = this.add.container(0, 0).setDepth(100);
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.45).setInteractive();
    const g = this.add.graphics();
    // 📱 휴대폰에서도 잘 보이게 화면 대부분을 쓰는 큰 창
    g.fillStyle(0x2fa25a, 0.35).fillRoundedRect(160, 32, 960, 672, 40);
    g.fillStyle(0xffffff, 0.97).fillRoundedRect(160, 22, 960, 672, 40);
    g.lineStyle(6, 0x5cd88a, 1).strokeRoundedRect(160, 22, 960, 672, 40);
    layer.add([dim, g]);
    const title = this.add.text(640, 70, '🎁 보상', { fontFamily: 'sans-serif', fontSize: '46px', fontStyle: 'bold', color: '#2fa25a' }).setOrigin(0.5);
    const goldLbl = this.add.text(640, 118, `보유 🪙 ${meta.gold}`, { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#c08a20' }).setOrigin(0.5);
    layer.add([title, goldLbl]);
    this.tweens.add({ targets: title, y: 64, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    const card = (y: number, h: number, color: number): void => {
      const cg = this.add.graphics();
      cg.fillStyle(color, 1).fillRoundedRect(190, y, 900, h, 26);
      layer.add(cg);
    };

    // 📅 일일 출석 — 7일 동그라미(받은 날 도장, 오늘 반짝)
    card(148, 296, 0xeefaf2);
    const canDaily = meta.canClaimDaily();
    const dailyTitle = this.add.text(220, 184, '', { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#2a6a3a' }).setOrigin(0, 0.5);
    layer.add(dailyTitle);
    const dayDots: Phaser.GameObjects.Container[] = [];
    const drawDays = (): void => {
      dayDots.forEach((d) => d.destroy());
      dayDots.length = 0;
      const today = Math.min(6, meta.dailyDayNumber() - 1); // 0~6 (7일 이후는 마지막 칸)
      const claimedToday = !meta.canClaimDaily();
      for (let i = 0; i < 7; i++) {
        const x = 640 + (i - 3) * 122;
        const y = 268;
        const done = i < today || (i === today && claimedToday);
        const isToday = i === today && !claimedToday;
        const c = this.add.container(x, y);
        const bg = this.add.circle(0, 0, 46, done ? 0x5cd88a : isToday ? 0xffd34d : 0xffffff).setStrokeStyle(4, done ? 0x2fa25a : isToday ? 0xe8a000 : 0xc8e8d0);
        c.add(bg);
        c.add(this.add.text(0, -12, done ? '✔' : '🪙', { fontSize: done ? '36px' : '30px', color: '#ffffff' }).setOrigin(0.5));
        c.add(this.add.text(0, 22, `${dailyAmount(i)}`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: done ? '#ffffff' : '#8a6a20' }).setOrigin(0.5));
        c.add(this.add.text(0, 68, `${i + 1}일`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#5a7a6a' }).setOrigin(0.5));
        if (isToday) this.tweens.add({ targets: c, scale: 1.1, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        layer.add(c);
        dayDots.push(c);
      }
      dailyTitle.setText(`📅 일일 출석  ·  연속 ${meta.dailyDayNumber()}일째`);
    };
    drawDays();
    const dailyBtn = cuteButton(this, 455, 396, 320, 66, canDaily ? '오늘 출석 받기!' : '내일 또 만나요 ⏰', canDaily ? 0x5cd88a : 0xc0c8d0, canDaily ? 0x2fa25a : 0x9098a8, '28px', () => {
      const got = meta.claimDaily();
      if (got <= 0) return;
      sfx(this, 'coin', 2);
      this.floatGold(640, 230, got);
      goldLbl.setText(`보유 🪙 ${meta.gold}`);
      drawDays();
      (dailyBtn.list[1] as Phaser.GameObjects.Text).setText('내일 또 만나요 ⏰');
      dailyBtn.disableInteractive().setAlpha(0.7);
    });
    dailyBtn.setDepth(101);
    if (!canDaily) dailyBtn.disableInteractive().setAlpha(0.7);
    layer.add(dailyBtn);
    // 📺 오늘의 무료 상자 — 하루 1번, 광고 보고 은 상자
    const freeOk = meta.canFreeChest();
    const freeBtn = cuteButton(this, 825, 396, 330, 66, freeOk ? '📺 무료 은 상자 받기' : '무료 상자 내일 또 ⏰', freeOk ? 0xa07aff : 0xc0c8d0, freeOk ? 0x7a4ad8 : 0x9098a8, '24px', () => {
      if (!meta.canFreeChest()) return;
      freeBtn.disableInteractive();
      (freeBtn.list[1] as Phaser.GameObjects.Text).setText('⏳ 광고…');
      void showRewarded('free_chest').then((ok) => {
        if (!ok) {
          (freeBtn.list[1] as Phaser.GameObjects.Text).setText('📺 무료 은 상자 받기');
          freeBtn.setInteractive({ useHandCursor: true });
          return;
        }
        meta.markFreeChest();
        (freeBtn.list[1] as Phaser.GameObjects.Text).setText('무료 상자 내일 또 ⏰');
        freeBtn.setAlpha(0.7);
        const loot = grantNewChest(1, goldMultFor(Math.max(1, meta.clearedMax)));
        chestPopup(this, loot, (k) => (unitsData as Record<string, { name: string }>)[k]?.name ?? k, () => goldLbl.setText(`보유 🪙 ${meta.gold}`));
      });
    });
    freeBtn.setDepth(101);
    if (!freeOk) freeBtn.disableInteractive().setAlpha(0.7);
    layer.add(freeBtn);

    // 💤 방치 보상 — 쌓인 시간 막대
    card(462, 210, 0xfff6e0);
    const IDLE_CAP_MS = 8 * 3600_000;
    const idleTitle = this.add.text(220, 500, '💤 방치 보상  (최대 8시간)', { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#8a5a10' }).setOrigin(0, 0.5);
    const bar = this.add.graphics();
    const idleDesc = this.add.text(220, 620, '', { fontFamily: 'sans-serif', fontSize: '25px', fontStyle: 'bold', color: '#9a7a40' }).setOrigin(0, 0.5);
    layer.add([idleTitle, bar, idleDesc]);
    const drawIdle = (): void => {
      const ratio = Math.min(1, (Date.now() - meta.lastSeen) / IDLE_CAP_MS);
      bar.clear();
      bar.fillStyle(0xf3e2b8, 1).fillRoundedRect(220, 548, 580, 30, 15);
      bar.fillStyle(0xffb02e, 1).fillRoundedRect(220, 548, Math.max(30, 580 * ratio), 30, 15);
      const pend = meta.pendingIdle();
      idleDesc.setText(pend > 0 ? `그동안 모은 골드 🪙 ${pend}` : '조금 더 기다리면 쌓여요 😴');
    };
    drawIdle();
    const idleOk = meta.pendingIdle() > 0;
    const idleBtn = cuteButton(this, 945, 584, 230, 70, idleOk ? '받기!' : '쌓는 중…', idleOk ? 0xffb02e : 0xc0c8d0, idleOk ? 0xd8862a : 0x9098a8, '28px', () => {
      const got = meta.claimIdle();
      if (got <= 0) return;
      sfx(this, 'coin', 2);
      this.floatGold(945, 540, got);
      goldLbl.setText(`보유 🪙 ${meta.gold}`);
      drawIdle();
      (idleBtn.list[1] as Phaser.GameObjects.Text).setText('쌓는 중…');
      idleBtn.disableInteractive().setAlpha(0.7);
    });
    idleBtn.setDepth(101);
    if (!idleOk) idleBtn.disableInteractive().setAlpha(0.7);
    layer.add(idleBtn);

    const close = this.add.text(1078, 66, '✕', { fontFamily: 'sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#2fa25a', padding: { x: 10, y: 4 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => layer.destroy());
    dim.on('pointerdown', () => layer.destroy());
    layer.add(close);
  }

  private floatGold(x: number, y: number, amount: number): void {
    const t = this.add.text(x, y, `+${amount} 🪙`, { fontFamily: 'sans-serif', fontSize: '26px', color: '#ffd34d' }).setOrigin(0.5).setDepth(110);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
}
