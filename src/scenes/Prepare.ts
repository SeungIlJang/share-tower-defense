import Phaser from 'phaser';
import unitsData from '../data/units.json';
import enemiesData from '../data/enemies.json';
import type { EnemyStats, UnitStats } from '../types';
import { meta } from '../systems/upgrades';
import { STAGES, WORLDS, recommendedLevel } from '../systems/worlds';
import { DECK_SIZE, KIND_INFO, UNIT_COUNTER, enemyKind, goodUnits, stageEnemies, stageKinds } from '../systems/counters';
import { isBoss } from '../systems/bosses';
import { enemyPortrait } from '../ui/enemyArt';
import { iconKey, textureKey } from '../systems/sprites';
import { RULE_INFO, stageRule, targetTime } from '../systems/stageRules';
import { formatTime } from '../systems/pacing';
import { cuteButton, cuteTitle, drawSky, type SkyTheme } from '../ui/cute';
import { sfx } from '../systems/sound';
import { preloadNeeded, stageEnemyTypes } from '../systems/assetLoad';
import { WEAPONS, WEAPON_SLOTS } from '../systems/weapons';
import { FEATURES, featureOn, reachedStage } from '../systems/tutorial';

const UNITS = unitsData as Record<string, UnitStats>;
const ENEMIES = enemiesData as Record<string, EnemyStats>;

/** ⚔️ 출전 준비 — 관문 미리보기(나오는 적·종류·보스) + 출전 덱 8칸 고르기. 계획: docs/hit-plan.md B */
export class PrepareScene extends Phaser.Scene {
  private stageId = 1;
  private deck: string[] = [];
  private deckLayer!: Phaser.GameObjects.Container;
  private deckHint!: Phaser.GameObjects.Text;
  private weaponDeck: string[] = [];
  private tab: 'units' | 'weapons' = 'units'; // 🃏 오른쪽 판: 유닛 덱 / 🔥 특수 무기
  private tabBtns: { key: 'units' | 'weapons'; bg: Phaser.GameObjects.Rectangle; t: Phaser.GameObjects.Text }[] = [];

  constructor() {
    super('Prepare');
  }

  init(data: { stageId: number }): void {
    this.stageId = data.stageId;
  }

  preload(): void {
    preloadNeeded(this, stageEnemyTypes(STAGES.find((s) => s.id === this.stageId) ?? STAGES[0]));
  }

  create(): void {
    const stage = STAGES.find((s) => s.id === this.stageId) ?? STAGES[0];
    drawSky(this, { theme: WORLDS[(stage.world ?? 1) - 1].theme as SkyTheme });
    const sr = stageRule(stage.id);
    const info = sr === 'normal' ? null : RULE_INFO[sr];
    cuteTitle(this, 640, 44, `관문 ${stage.id}${info ? ` · ${info.icon} ${info.name}` : ''} — 출전 준비`, 38);
    if (info)
      this.add
        .text(592, 668, info.desc.replace('! ', '!\n'), { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#3a2a10', align: 'center', backgroundColor: '#fff4c8e8', padding: { x: 10, y: 5 } })
        .setOrigin(0.5)
        .setDepth(5);
    const owned = Object.keys(UNITS).filter((k) => meta.ownsUnit(k));
    this.deck = meta.activeDeck(Object.keys(UNITS));
    this.weaponDeck = meta.activeWeapons();
    this.tab = 'units';

    // 👀 왼쪽: 나오는 적
    const panel = (x: number, w: number): void => {
      const g = this.add.graphics();
      g.fillStyle(0xffffff, 0.93).fillRoundedRect(x, 84, w, 520, 26);
      g.lineStyle(4, 0x6a8ad8, 1).strokeRoundedRect(x, 84, w, 520, 26);
    };
    panel(30, 560);
    this.add.text(310, 112, '👀 나오는 적', { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#3a4a7a' }).setOrigin(0.5);
    const list = stageEnemies(stage).slice(0, 10);
    list.forEach((e, i) => {
      const x = 92 + (i % 5) * 109;
      const y = 178 + Math.floor(i / 5) * 118;
      const boss = isBoss(e.type);
      if (boss) this.add.circle(x, y, 40, 0xff4a4a, 0.18).setStrokeStyle(3, 0xff4a4a);
      if (!enemyPortrait(this, e.type, x, y, 82, 68)) this.add.text(x, y, '👾', { fontSize: '40px', padding: { top: 10, bottom: 4 } }).setOrigin(0.5);
      const k = enemyKind(e.type);
      if (k) this.add.text(x + 32, y - 30, KIND_INFO[k].icon, { fontSize: '18px', padding: { top: 6, bottom: 2 } }).setOrigin(0.5);
      this.add.text(x, y + 44, ENEMIES[e.type]?.name ?? e.type, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: boss ? '#d8323a' : '#3a3a5a' }).setOrigin(0.5);
      this.add.text(x, y + 60, boss ? '👑 보스' : `×${e.count}`, { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: boss ? '#d8323a' : '#7a86a8' }).setOrigin(0.5);
    });
    // 🎯 적 종류 → 추천 유닛
    const kinds = stageKinds(stage).slice(0, 3);
    const box = this.add.graphics();
    box.fillStyle(0xeef3ff, 1).fillRoundedRect(46, 396, 528, 172, 16);
    this.add.text(62, 414, '🎯 이번 관문 공략', { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#3a4a7a' }).setOrigin(0, 0.5);
    kinds.forEach((k, i) => {
      const y = 452 + i * 40;
      const units = Object.keys(UNITS).filter((u) => UNIT_COUNTER[u] === k.kind);
      this.add.text(62, y, `${KIND_INFO[k.kind].icon} ${KIND_INFO[k.kind].name} ×${k.count}`, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#3a4a6a' }).setOrigin(0, 0.5);
      this.add.text(212, y, '→', { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#8a96b8' }).setOrigin(0.5);
      let ux = 250; // 얼굴 + 이름을 이어서(이름 길이만큼 띄움)
      units.slice(0, 5).forEach((u) => {
        if (ux > 540) return;
        const has = owned.includes(u);
        if (this.textures.exists(iconKey(u))) this.add.image(ux, y - 2, iconKey(u)).setDisplaySize(32, 32).setAlpha(has ? 1 : 0.4);
        const t = this.add.text(ux + 19, y + 2, has ? UNITS[u].name : '🔒', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: has ? '#2a6a3a' : '#9aa0b0' }).setOrigin(0, 0.5);
        ux += 19 + t.width + 26;
      });
    });
    const rec = recommendedLevel(stage.id, stage.enemyMult ?? 1);
    const tt = targetTime(stage, sr);
    this.add.text(310, 586, `권장 유닛 강화 Lv${rec}${tt ? `   ·   ⏱️ 목표 ${formatTime(tt)}` : ''}`, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#6a76a0' }).setOrigin(0.5);

    // 🃏 오른쪽: 출전 덱
    panel(620, 630);
    this.deckHint = this.add.text(935, 146, '', { fontFamily: 'sans-serif', fontSize: '15px', color: '#7a86a8' }).setOrigin(0.5);
    this.deckLayer = this.add.container(0, 0);
    const good = new Set(goodUnits(stage, owned));
    const weaponOn = featureOn('weapon', reachedStage(stage.id, meta.clearedMax), false);
    const render = (): void => {
      if (this.tab === 'units') this.renderDeck(owned, good);
      else this.renderWeapons(weaponOn);
      this.tabBtns.forEach((b) => {
        const on = b.key === this.tab;
        b.bg.setFillStyle(on ? 0x6a8ad8 : 0xe4e9f5).setStrokeStyle(2, on ? 0x3a5aa8 : 0xc0c8d8);
        b.t.setColor(on ? '#ffffff' : '#5a6688').setText(b.key === 'units' ? `🃏 유닛 ${this.deck.length}/${DECK_SIZE}` : `🔥 무기 ${this.weaponDeck.length}/${WEAPON_SLOTS}`);
      });
    };
    this.tabBtns = (['units', 'weapons'] as const).map((key, i) => {
      const bg = this.add.rectangle(830 + i * 210, 112, 196, 42, 0xe4e9f5).setInteractive({ useHandCursor: true });
      const t = this.add.text(830 + i * 210, 112, '', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5);
      bg.on('pointerdown', () => {
        if (this.tab === key) return;
        this.tab = key;
        sfx(this, 'click');
        render();
      });
      return { key, bg, t };
    });
    this.rerender = render;
    render();

    cuteButton(this, 250, 668, 220, 58, '← 뒤로', 0x8a9ab8, 0x5a6a88, '22px', () => this.scene.start('StageSelect', { world: stage.world }));
    cuteButton(this, 935, 668, 300, 64, '⚔️ 출전!', 0xff7a4a, 0xd8502a, '30px', () => {
      meta.setDeck(this.deck);
      meta.setWeaponDeck(this.weaponDeck);
      sfx(this, 'click');
      this.scene.start('Battle', { stageId: stage.id });
    });
  }

  private rerender: () => void = () => undefined;

  /** 🔥 특수 무기 고르기 — 산 무기 중 8개(산 게 8개 이하면 전부 자동) */
  private renderWeapons(unlocked: boolean): void {
    this.deckLayer.removeAll(true);
    if (!unlocked) {
      this.deckHint.setText('');
      this.deckLayer.add(this.add.text(935, 330, `🔒 특수 무기는 ${(FEATURES.find((f) => f.key === 'weapon')?.stage ?? 3) - 1}관문을 깨면 열려요`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#7a86a8' }).setOrigin(0.5));
      return;
    }
    const owned = WEAPONS.filter((w) => meta.ownsWeapon(w.key)).map((w) => w.key);
    const editable = owned.length > WEAPON_SLOTS;
    this.deckHint.setText(editable ? '눌러서 넣고 빼요 · 전투 화면엔 8개가 고정으로 나와요' : `무기를 ${WEAPON_SLOTS + 1}개 이상 사면 고를 수 있어요 · 지금은 산 무기 모두 출전`);
    const iconTex = textureKey('weapon_icons');
    WEAPONS.forEach((w, i) => {
      const x = 688 + (i % 5) * 123;
      const y = 222 + Math.floor(i / 5) * 140;
      const has = owned.includes(w.key);
      const on = this.weaponDeck.includes(w.key);
      const card = this.add.rectangle(x, y, 116, 128, on ? 0xe8f8ee : 0xeef0f5).setStrokeStyle(on ? 5 : 2, on ? 0x2fa25a : 0xc0c8d8);
      const parts: Phaser.GameObjects.GameObject[] = [card];
      const a = on ? 1 : has ? 0.5 : 0.25;
      parts.push(this.textures.exists(iconTex) ? this.add.image(x, y - 18, iconTex, i).setDisplaySize(60, 60).setAlpha(a) : this.add.text(x, y - 18, w.icon, { fontSize: '40px', padding: { top: 10, bottom: 4 } }).setOrigin(0.5).setAlpha(a));
      parts.push(this.add.text(x, y + 26, w.name, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: on ? '#2a3a2a' : '#8a92a8' }).setOrigin(0.5));
      parts.push(this.add.text(x, y + 47, has ? w.desc : '🔒 강화에서 구매', { fontFamily: 'sans-serif', fontSize: '11px', color: '#7a86a8', align: 'center', wordWrap: { width: 108 } }).setOrigin(0.5, 0.5));
      if (on) parts.push(this.add.text(x - 44, y - 50, String(this.weaponDeck.indexOf(w.key) + 1), { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff', backgroundColor: '#2fa25a', padding: { x: 6, y: 2 } }).setOrigin(0.5));
      if (editable && has) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => {
          if (on) {
            if (this.weaponDeck.length <= 1) return;
            this.weaponDeck = this.weaponDeck.filter((d) => d !== w.key);
          } else if (this.weaponDeck.length >= WEAPON_SLOTS) {
            this.toast('무기 칸이 가득 찼어요 — 하나를 먼저 빼 주세요');
            return;
          } else this.weaponDeck.push(w.key);
          sfx(this, 'click');
          this.rerender();
        });
      }
      this.deckLayer.add(parts);
    });
  }

  private renderDeck(owned: string[], good: Set<string>): void {
    this.deckLayer.removeAll(true);
    const editable = owned.length > DECK_SIZE;
    this.deckHint.setText(editable ? '눌러서 넣고 빼요 · 🎯 = 이번 관문에 유리' : `유닛이 ${DECK_SIZE + 1}개 이상이면 덱을 고를 수 있어요 · 🎯 = 유리`);
    owned.forEach((k, i) => {
      const x = 688 + (i % 5) * 123;
      const y = 222 + Math.floor(i / 5) * 122;
      const on = this.deck.includes(k);
      const card = this.add.rectangle(x, y, 116, 112, on ? 0xe8f8ee : 0xeef0f5).setStrokeStyle(on ? 5 : 2, on ? 0x2fa25a : 0xc0c8d8);
      const parts: Phaser.GameObjects.GameObject[] = [card];
      if (this.textures.exists(iconKey(k))) parts.push(this.add.image(x, y - 12, iconKey(k)).setDisplaySize(58, 58).setAlpha(on ? 1 : 0.45));
      parts.push(this.add.text(x, y + 38, UNITS[k].name, { fontFamily: 'sans-serif', fontSize: UNITS[k].name.length >= 5 ? '13px' : '15px', fontStyle: 'bold', color: on ? '#2a3a2a' : '#8a92a8' }).setOrigin(0.5));
      const ck = UNIT_COUNTER[k];
      if (ck) parts.push(this.add.text(x + 40, y - 40, `▶${KIND_INFO[ck].icon}`, { fontSize: '13px', padding: { top: 6, bottom: 2 } }).setOrigin(0.5));
      if (good.has(k)) parts.push(this.add.text(x - 40, y - 40, '🎯', { fontSize: '18px', padding: { top: 6, bottom: 2 } }).setOrigin(0.5));
      if (on) parts.push(this.add.text(x - 44, y + 12, String(this.deck.indexOf(k) + 1), { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff', backgroundColor: '#2fa25a', padding: { x: 6, y: 2 } }).setOrigin(0.5));
      if (editable) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => {
          if (on) {
            if (this.deck.length <= 1) return;
            this.deck = this.deck.filter((d) => d !== k);
          } else if (this.deck.length >= DECK_SIZE) {
            this.toast('덱이 가득 찼어요 — 하나를 먼저 빼 주세요');
            return;
          } else this.deck.push(k);
          sfx(this, 'click');
          this.rerender();
        });
      }
      this.deckLayer.add(parts);
    });
  }

  private toast(msg: string): void {
    const t = this.add
      .text(935, 590, msg, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#fff', backgroundColor: '#d8502aee', padding: { x: 12, y: 6 } })
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({ targets: t, y: 560, alpha: 0, delay: 900, duration: 400, onComplete: () => t.destroy() });
  }
}
