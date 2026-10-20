import Phaser from 'phaser';
import unitsData from '../data/units.json';
import type { UnitStats } from '../types';
import { unitPrice, weaponPrice } from '../systems/unlocks';
import { iconKey, spriteOf, textureKey } from '../systems/sprites';
import { meta, scaleStat } from '../systems/upgrades';
import { bgm, sfx } from '../systems/sound';
import { WEAPONS, weaponChargeMult, weaponDurationMult, weaponPowerMult } from '../systems/weapons';
import { UNIT_SKILLS, skillEvery, skillMult } from '../systems/unitSkills';
import { skinType, skinsFor } from '../systems/skins';
import { ensureSkin, loadLook } from '../systems/skinTextures';
import { BASE_MAX_LV, BASE_UPGRADES } from '../systems/baseUpgrades';
import { AURA_MAX_LV, AURA_RADIUS, HERO_MAX_LV, HERO_SKILLS, SKILL_MAX_LV, auraBonus, heroLvMult, heroSkillPower, heroUpCost } from '../systems/hero';

const UNITS = unitsData as Record<string, UnitStats>;

type Tab = 'units' | 'weapons' | 'base' | 'hero';

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
      ['units', '🛡️ 유닛', 370],
      ['weapons', '🔥 특수 무기', 545],
      ['hero', '👑 영웅', 720],
      ['base', '🏰 기지', 880],
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
    else if (this.tab === 'weapons') this.renderWeapons();
    else if (this.tab === 'hero') this.renderHero();
    else this.renderBase();
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
    const list = skinsFor(key, !!spriteOf(skinType(key, 'legend')));
    if (!list.length) return undefined;
    const eq = list.find((sk) => sk.id === meta.equippedSkin(key));
    return {
      label: eq ? `${eq.grade === 'legend' ? '🟡' : '🔵'} ${eq.name}` : '👗 스킨',
      color: eq?.grade === 'legend' ? 0xd8962a : eq ? 0x3a8adf : 0x7a4ad8,
      onClick: () => this.openSkinPicker(key),
    };
  }

  /** 👗 스킨 고르기 — 기본 / 🔵 레어(색 바꿈) / 🟡 전설(새 그림). 없으면 구매, 있으면 착용 */
  private openSkinPicker(key: string): void {
    // 전설 그림을 아직 안 받았으면 받고 나서 열기
    const legend = skinType(key, 'legend');
    if (spriteOf(legend) && !this.textures.exists(textureKey(legend))) {
      loadLook(this, legend, () => this.openSkinPicker(key));
      return;
    }
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(0xffffff, 0.97).fillRoundedRect(310, 150, 660, 400, 30);
    panel.lineStyle(5, 0xa07aff, 1).strokeRoundedRect(310, 150, 660, 400, 30);
    layer.add([dim, panel]);
    layer.add(this.add.text(640, 188, `👗 ${UNITS[key].name} 스킨`, { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#6a4ad8' }).setOrigin(0.5));
    layer.add(this.add.text(640, 222, `보유 🪙 ${meta.gold}`, { fontFamily: 'sans-serif', fontSize: '16px', color: '#a07a20' }).setOrigin(0.5));

    const hasLegend = !!spriteOf(skinType(key, 'legend'));
    const options: { id: string | null; name: string; grade: string; price: number; color: number }[] = [
      { id: null, name: '기본 복장', grade: '⚪ 기본', price: 0, color: 0x8a92a0 },
      ...skinsFor(key, hasLegend).map((sk) => ({
        id: sk.id,
        name: sk.name,
        grade: sk.grade === 'legend' ? '🟡 전설' : '🔵 레어',
        price: sk.price,
        color: sk.grade === 'legend' ? 0xe8a000 : 0x3a8adf,
      })),
    ];
    if (!hasLegend) options.push({ id: '?', name: '준비 중', grade: '🟡 전설', price: 0, color: 0xc8ccd8 });

    const w = 190;
    const x0 = 640 - ((options.length - 1) * (w + 16)) / 2;
    options.forEach((o, i) => {
      const x = x0 + i * (w + 16);
      const y = 380;
      const g = this.add.graphics();
      const equipped = (meta.equippedSkin(key) ?? null) === o.id;
      g.fillStyle(equipped ? 0xf0f6ff : 0xf6f6fa, 1).fillRoundedRect(x - w / 2, y - 130, w, 250, 18);
      g.lineStyle(equipped ? 5 : 3, o.color, 1).strokeRoundedRect(x - w / 2, y - 130, w, 250, 18);
      layer.add(g);
      // 미리보기 — 첫 프레임
      const look = o.id === '?' ? null : o.id ? ensureSkin(this, key, o.id) : key;
      const def = look ? spriteOf(look) ?? spriteOf(key) : null;
      if (look && def && this.textures.exists(textureKey(look))) {
        const img = this.add.image(x, y - 40, textureKey(look), def.anims.idle!.frames[0]);
        img.setScale(Math.min(110 / def.frameHeight, 150 / def.frameWidth));
        layer.add(img);
      } else {
        layer.add(this.add.text(x, y - 40, '❔', { fontSize: '54px' }).setOrigin(0.5).setAlpha(0.5));
      }
      layer.add(this.add.text(x, y - 112, o.grade, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#6a6a80' }).setOrigin(0.5));
      layer.add(this.add.text(x, y + 38, o.name, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#3a3a5a' }).setOrigin(0.5));

      const owned = o.id === null || (o.id !== '?' && meta.ownsSkin(key, o.id));
      const [label, col] =
        o.id === '?'
          ? ['그림 준비 중', '#8a92a0']
          : equipped
            ? ['✓ 착용 중', '#8a92a0']
            : owned
              ? ['착용하기', '#3a8adf']
              : [`구매 🪙${o.price}`, meta.gold >= o.price ? '#2fa25a' : '#b0b4c0'];
      const btn = this.add
        .text(x, y + 84, label, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', backgroundColor: col, padding: { x: 14, y: 7 } })
        .setOrigin(0.5);
      layer.add(btn);
      if (o.id === '?' || equipped) return;
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => {
        if (!owned) {
          if (!meta.buySkin(key, o.id!, o.price)) return;
          sfx(this, 'levelup');
        } else {
          meta.equipSkin(key, o.id);
          sfx(this, 'click');
        }
        layer.destroy();
        this.render();
        this.openSkinPicker(key);
      });
    });

    const close = this.add.text(940, 176, '✕', { fontFamily: 'sans-serif', fontSize: '28px', color: '#6a4ad8' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => layer.destroy());
    dim.on('pointerdown', () => layer.destroy());
    layer.add(close);
  }

  /** ✨ 유닛 스킬 안내 — Lv0: 'Lv1 해금', Lv1+: '공격 N번마다 · ×배율' */
  private skillLabel(key: string, lv: number): string {
    const sk = UNIT_SKILLS[key];
    if (!sk) return '';
    if (lv <= 0) return `✨${sk.name} (강화 시 해금)`;
    return `✨${sk.name} · ${skillEvery(lv)}타마다 ×${skillMult(lv).toFixed(1)}`;
  }

  /** 👑 영웅 강화 — 영웅 레벨 · 오라 크기 · 영웅 스킬 해금/위력 */
  private renderHero(): void {
    const count = 2 + HERO_SKILLS.length;
    const pct = (m: number): string => `+${Math.round((m - 1) * 100)}%`;
    const up = (key: string, kind: 'hero' | 'aura' | 'skill', max: number): void => {
      if (meta.upgradeHero(key, heroUpCost(kind, meta.heroLevel(key)), max)) {
        sfx(this, 'weapon');
        this.render();
      }
    };
    const row = (i: number, key: string, kind: 'hero' | 'aura' | 'skill', max: number, title: string, desc: string): void => {
      const lv = meta.heroLevel(key);
      const cost = heroUpCost(kind, lv);
      const maxed = lv >= max;
      this.card(i, count, null, `${title}  Lv.${lv}${maxed ? ' (MAX)' : ''}`, desc, maxed ? 'MAX' : `강화 🪙${cost}`, !maxed && meta.gold >= cost, false, () => up(key, kind, max));
    };
    const hl = meta.heroLevel('hero');
    row(0, 'hero', 'hero', HERO_MAX_LV, '👑 영웅', `❤️ 체력 · ⚔️ 공격력 ${pct(heroLvMult(hl))}  →  ${pct(heroLvMult(hl + 1))}`);
    const al = meta.heroLevel('aura');
    row(1, 'aura', 'aura', AURA_MAX_LV, '⭕ 오라 크기', `오라 반지름 ${AURA_RADIUS + auraBonus(al)}  →  ${AURA_RADIUS + auraBonus(al + 1)}`);
    HERO_SKILLS.forEach((sk, j) => {
      const i = 2 + j;
      if (!meta.ownsHeroSkill(sk.key)) {
        this.card(i, count, null, `${sk.icon} ${sk.name}  (${sk.hotkey})`, `${sk.desc} · 💧${sk.mana}`, `🛒 해금\n🪙${sk.price}`, meta.gold >= sk.price, true, () => {
          if (meta.buyHeroSkill(sk.key, sk.price)) {
            sfx(this, 'levelup');
            this.render();
          }
        });
        return;
      }
      const lv = meta.heroLevel(sk.key);
      row(i, sk.key, 'skill', SKILL_MAX_LV, `${sk.icon} ${sk.name}`, `${sk.desc} · 위력 ${pct(heroSkillPower(lv))} → ${pct(heroSkillPower(lv + 1))}`);
    });
  }

  /** 🏰 기지 강화 — 인구 상한 · 소환 에너지(충전·상한) */
  private renderBase(): void {
    BASE_UPGRADES.forEach((b, i) => {
      const lv = meta.baseLevel(b.key);
      const cost = meta.baseNextCost(b.key);
      this.card(
        i,
        BASE_UPGRADES.length,
        null,
        `${b.icon} ${b.name}  Lv.${lv}${lv >= BASE_MAX_LV ? ' (MAX)' : ''}`,
        cost === null ? b.effect(lv) : `${b.effect(lv)}  →  ${b.effect(lv + 1)}`,
        cost === null ? 'MAX' : `강화 🪙${cost}`,
        cost !== null && meta.gold >= cost,
        false,
        () => {
          if (meta.upgradeBase(b.key)) {
            sfx(this, 'weapon');
            this.render();
          }
        }
      );
    });
    this.layer.add(
      this.add
        .text(640, GRID_TOP + 150, `전투 중 레벨업 '보급'과 함께 쌓여요 · 최대 Lv.${BASE_MAX_LV}`, { fontFamily: 'sans-serif', fontSize: '16px', color: '#9fb3d0' })
        .setOrigin(0.5)
    );
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
