import Phaser from 'phaser';
import unitsData from '../data/units.json';
import type { UnitStats } from '../types';
import { unitPrice, weaponPrice } from '../systems/unlocks';
import { iconKey, textureKey } from '../systems/sprites';
import { meta, scaleStat } from '../systems/upgrades';
import { bgm, sfx } from '../systems/sound';
import { WEAPONS, weaponChargeMult, weaponDurationMult, weaponPowerMult } from '../systems/weapons';
import { UNIT_SKILLS, skillEvery, skillMult } from '../systems/unitSkills';
import { SKINS } from '../systems/skins';
import { ensureSkin } from '../systems/skinTextures';

const UNITS = unitsData as Record<string, UnitStats>;

type Tab = 'units' | 'weapons';

/** 지속시간이 핵심인 무기(위력 대신 지속시간 표시) */
const DURATION_WEAPONS = new Set(['freeze', 'guard', 'berserk']);

const GRID_TOP = 160;
const GRID_H = 470;

/** 영구 강화 씬 — 메타 골드로 [유닛 강화] hp·atk / [특수 무기 강화] 위력·충전·지속 */
export class UpgradeScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private tab: Tab = 'units';
  private tabBtns: Partial<Record<Tab, Phaser.GameObjects.Text>> = {};

  constructor() {
    super('Upgrade');
  }

  create(): void {
    bgm(this, 'bgm_menu');
    this.add
      .text(640, 46, '🔧 강화', { fontFamily: 'sans-serif', fontSize: '38px', color: '#ffd34d' })
      .setOrigin(0.5);
    this.goldText = this.add
      .text(640, 88, '', { fontFamily: 'sans-serif', fontSize: '20px', color: '#ffe14d' })
      .setOrigin(0.5);

    // 탭
    const tabs: [Tab, string, number][] = [
      ['units', '🛡️ 유닛 강화', 540],
      ['weapons', '🔥 특수 무기 강화', 740],
    ];
    for (const [key, label, x] of tabs) {
      const t = this.add
        .text(x, 128, label, { fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#fff', padding: { x: 18, y: 7 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        this.tab = key;
        this.render();
      });
      this.tabBtns[key] = t;
    }

    this.layer = this.add.container(0, 0);
    this.render();

    const back = this.add
      .text(640, 668, '← 스테이지 선택', {
        fontFamily: 'sans-serif',
        fontSize: '22px',
        color: '#fff',
        backgroundColor: '#3a7bff',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => this.scene.start('StageSelect'));
  }

  private render(): void {
    this.layer.removeAll(true);
    this.goldText.setText(`보유 🪙 ${meta.gold}`);
    for (const [key, t] of Object.entries(this.tabBtns) as [Tab, Phaser.GameObjects.Text][]) {
      const on = key === this.tab;
      t.setBackgroundColor(on ? '#3a7bff' : '#20304e').setColor(on ? '#fff' : '#8ea0c0');
    }
    if (this.tab === 'units') this.renderUnits();
    else this.renderWeapons();
  }

  /** 2열 격자의 i번째 칸 위치 */
  private cell(i: number, count: number): { x: number; y: number; h: number } {
    const rows = Math.ceil(count / 2);
    const h = Math.min(110, GRID_H / rows);
    return { x: i % 2 === 0 ? 330 : 950, y: GRID_TOP + h / 2 + Math.floor(i / 2) * h, h };
  }

  /** 한 줄 카드: 아이콘 · 제목 · 설명 · 강화 버튼 */
  private card(
    i: number,
    count: number,
    icon: Phaser.GameObjects.Image | null,
    title: string,
    desc: string,
    btnLabel: string,
    canUp: boolean,
    dim: boolean,
    onUp: () => void,
    extra = '', // 제목 오른쪽 작은 글씨(유닛 스킬)
    skin?: { label: string; color: number; onClick: () => void } // 👗 스킨 버튼
  ): void {
    const { x, y, h } = this.cell(i, count);
    const parts: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(x, y, 600, h - 8, 0x1a2338).setStrokeStyle(2, 0x33406a),
    ];
    if (icon) parts.push(icon.setPosition(x - 262, y).setDisplaySize(48, 48).setAlpha(dim ? 0.35 : 1));
    parts.push(
      this.add.text(x - 228, y - 14, title, { fontFamily: 'sans-serif', fontSize: '20px', color: dim ? '#7c8aa0' : '#fff' }).setOrigin(0, 0.5),
      this.add.text(x - 228, y + 14, desc, { fontFamily: 'sans-serif', fontSize: '13px', color: '#9fb3d0' }).setOrigin(0, 0.5)
    );
    if (skin) {
      const sb = this.add
        .text(x + 120, y + 14, skin.label, { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffffff', backgroundColor: `#${skin.color.toString(16).padStart(6, '0')}`, padding: { x: 7, y: 3 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      sb.on('pointerdown', skin.onClick);
      parts.push(sb);
    }
    if (extra) parts.push(this.add.text(x - 70, y - 14, extra, { fontFamily: 'sans-serif', fontSize: '13px', color: '#ffe680' }).setOrigin(0, 0.5));
    const btn = this.add
      .rectangle(x + 232, y, 118, h - 20, canUp ? 0x2f7a4d : 0x3a3f55)
      .setStrokeStyle(2, canUp ? 0x5cff9e : 0x555)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add
      .text(x + 232, y, btnLabel, { fontFamily: 'sans-serif', fontSize: '15px', color: '#fff', align: 'center' })
      .setOrigin(0.5);
    btn.on('pointerdown', onUp);
    parts.push(btn, btnText);
    this.layer.add(parts);
  }

  private renderUnits(): void {
    const keys = Object.keys(UNITS);
    keys.forEach((key, i) => {
      const u = UNITS[key];
      const owned = meta.ownsUnit(key);
      const price = unitPrice(i);
      const lv = meta.level(key);
      const look = owned ? ensureSkin(this, key, meta.equippedSkin(key)) : key; // 👗 착용 스킨 얼굴
      const icon = this.textures.exists(iconKey(look)) ? this.add.image(0, 0, iconKey(look)) : null;
      this.card(
        i,
        keys.length,
        icon,
        `${u.name}  Lv.${lv}`,
        `❤️ ${scaleStat(u.hp, lv)}  ⚔️ ${scaleStat(u.atk, lv)}  →  Lv.${lv + 1}: ❤️ ${scaleStat(u.hp, lv + 1)} ⚔️ ${scaleStat(u.atk, lv + 1)}`,
        owned ? `강화 🪙${meta.nextCost(key)}` : `🛒 구매\n🪙${price}`,
        owned ? meta.canUpgrade(key) : meta.gold >= price,
        !owned,
        () => {
          if (!owned) {
            if (meta.buyUnit(key, price)) {
              sfx(this, 'levelup');
              this.render();
            }
            return;
          }
          if (meta.upgrade(key)) {
            sfx(this, 'weapon');
            this.render();
          }
        },
        this.skillLabel(key, lv),
        owned ? this.skinButton(key) : undefined
      );
    });
  }

  /** 👗 레어 스킨 버튼 — 없으면 구매(바로 착용), 있으면 착용/해제 */
  private skinButton(key: string): { label: string; color: number; onClick: () => void } | undefined {
    const sk = SKINS[key];
    if (!sk) return undefined;
    if (!meta.ownsSkin(key, sk.id)) {
      const can = meta.gold >= sk.price;
      return {
        label: `👗 스킨 🪙${sk.price}`,
        color: can ? 0x7a4ad8 : 0x8a8aa0,
        onClick: () => {
          if (meta.buySkin(key, sk.id, sk.price)) {
            sfx(this, 'levelup');
            this.render();
          }
        },
      };
    }
    const on = meta.equippedSkin(key) === sk.id;
    return {
      label: on ? `👗 ${sk.name} ✓` : '👗 기본 복장',
      color: on ? 0x3a8adf : 0x5a6a8a,
      onClick: () => {
        meta.toggleSkin(key, sk.id);
        sfx(this, 'click');
        this.render();
      },
    };
  }

  /** ✨ 유닛 스킬 안내 — Lv0: 'Lv1 해금', Lv1+: '공격 N번마다 · ×배율' */
  private skillLabel(key: string, lv: number): string {
    const sk = UNIT_SKILLS[key];
    if (!sk) return '';
    if (lv <= 0) return `✨${sk.name} (강화 시 해금)`;
    return `✨${sk.name} · ${skillEvery(lv)}타마다 ×${skillMult(lv).toFixed(1)}`;
  }

  private renderWeapons(): void {
    const iconTex = textureKey('weapon_icons');
    WEAPONS.forEach((w, i) => {
      const lv = meta.weaponLevel(w.key);
      const icon = this.textures.exists(iconTex) ? this.add.image(0, 0, iconTex, i) : null;
      const sec = (l: number): string => (w.chargeSec * weaponChargeMult(l)).toFixed(1);
      const pct = (m: number): string => `+${Math.round((m - 1) * 100)}%`;
      const effect = DURATION_WEAPONS.has(w.key)
        ? `지속 ${pct(weaponDurationMult(lv))} → ${pct(weaponDurationMult(lv + 1))}`
        : `위력 ${pct(weaponPowerMult(lv))} → ${pct(weaponPowerMult(lv + 1))}`;
      const cost = meta.weaponNextCost(w.key);
      const owned = meta.ownsWeapon(w.key);
      const price = weaponPrice(i);
      this.card(
        i,
        WEAPONS.length,
        icon,
        `${w.name}  Lv.${lv}`,
        `${effect}  ·  충전 ${sec(lv)}초 → ${sec(lv + 1)}초`,
        owned ? `강화 🪙${cost}` : `🛒 구매\n🪙${price}`,
        meta.gold >= (owned ? cost : price),
        !owned,
        () => {
          if (!owned) {
            if (meta.buyWeapon(w.key, price)) {
              sfx(this, 'levelup');
              this.render();
            }
            return;
          }
          if (meta.upgradeWeapon(w.key)) {
            sfx(this, 'weapon');
            this.render();
          }
        }
      );
    });
  }
}
