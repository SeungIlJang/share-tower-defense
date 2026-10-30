import Phaser from 'phaser';
import unitsData from '../data/units.json';
import type { UnitStats } from '../types';
import { unitPrice, weaponPrice } from '../systems/unlocks';
import { animKey, iconKey, spriteOf, spriteOfLook, textureKey } from '../systems/sprites';
import { meta, scaleStat } from '../systems/upgrades';
import { bgm, sfx } from '../systems/sound';
import { WEAPONS, weaponChargeMult, weaponDurationMult, weaponPowerMult } from '../systems/weapons';
import { UNIT_SKILLS, skillEvery, skillMult } from '../systems/unitSkills';
import { skinType, skinsFor } from '../systems/skins';
import { ensureSkin, loadLook } from '../systems/skinTextures';
import { BASE_MAX_LV, BASE_UPGRADES } from '../systems/baseUpgrades';
import { ALLY_CASTLE_TIERS, CASTLE_MAX_LV, CASTLE_RATE_MAX_LV, allyCastleGun, allyCastleTier, castleHpMult, castleLook } from '../systems/castle';
import { RANK_MAX, rankMult, rankUpCost } from '../systems/chests';
import { EQUIP_MAX, GRADE_COLORS, GRADE_NAMES, HERO_WEAPONS, RINGS, equipUpCost } from '../systems/equipment';
import { MILESTONE_TEXT, milestoneBonus, milestoneKind, milestonesAt, nextMilestone } from '../systems/milestones';
import { BRANCH_CHANGE_GOLD, BRANCH_INFO, BRANCH_TIER, GRADE_INFO, MAX_TIER, UNIT_TIERS, evoCost, evolvedKey, gradeOf, levelCap, nextUnitTier, perkText, readyToEvolve, starText, unitOfKey, type Branch } from '../systems/evolution';
import { AURA_MAX_LV, AURA_RADIUS, HERO_FALLBACK_LOOKS, HERO_MAX_LV, HERO_SKILLS, HERO_TIERS, SKILL_MAX_LV, auraBonus, heroLvMult, heroSkillPower, heroTier, heroUpCost, nextHeroTier } from '../systems/hero';
import { VIEW_W } from '../systems/view';
import { UNIT_GROUPS, unitGroup, type UnitGroup } from '../systems/unitGroups';
import { preloadNeeded } from '../systems/assetLoad';
import { unitPreloadKeys } from '../systems/evolution';

const UNITS = unitsData as Record<string, UnitStats>;

type Tab = 'units' | 'weapons' | 'base' | 'hero';

/** 지속시간이 핵심인 무기(위력 대신 지속시간 표시) */
const DURATION_WEAPONS = new Set(['freeze', 'guard', 'berserk']);

const GRID_TOP = 118; // 제목·보유 골드를 한 줄로 올려서 카드 공간 확보
const GRID_H = 548;
const SUB_H = 34; // 유닛 탭: 근접·원거리·설치물 고르는 줄

/** 영구 강화 씬 — 메타 골드로 [유닛 강화] hp·atk / [특수 무기 강화] 위력·충전·지속 */
export class UpgradeScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;
  private tab: Tab = 'units';
  private tabBtns: Partial<Record<Tab, Phaser.GameObjects.Text>> = {};
  private static group: UnitGroup = 'melee'; // 🛡️ 마지막으로 본 유닛 묶음(다시 열어도 유지)

  constructor() {
    super('Upgrade');
  }

  private fromBattle = false; // ⚔️ 전투 중 상점(전투는 일시정지 상태)

  init(data?: { fromBattle?: boolean }): void {
    this.fromBattle = !!data?.fromBattle;
  }

  preload(): void {
    const keys = unitPreloadKeys(Object.keys(UNITS), (k) => !!spriteOf(k), (u) => meta.tier(u), (u) => meta.equippedSkin(u));
    preloadNeeded(this, [...keys]);
  }

  create(): void {
    if (this.fromBattle) this.add.rectangle(640, 360, VIEW_W, 720, 0x0d1018); // 멈춘 전투 화면을 가림
    else bgm(this, 'bgm_menu');
    this.add
      .text(628, 38, '🔧 강화', { fontFamily: 'sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#ffd34d' })
      .setOrigin(1, 0.5);
    this.goldText = this.add
      .text(652, 38, '', { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffe14d', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0, 0.5); // '강화' 옆

    // 탭
    const tabs: [Tab, string, number][] = [
      ['units', '🛡️ 유닛', 370],
      ['weapons', '🔥 특수 무기', 545],
      ['hero', '👑 영웅', 720],
      ['base', '🏰 기지', 880],
    ];
    for (const [key, label, x] of tabs) {
      const t = this.add
        .text(x, 86, label, { fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#fff', padding: { x: 18, y: 6 } })
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
      .text(640, 694, this.fromBattle ? '⚔️ 전투로 돌아가기' : '← 스테이지 선택', {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#fff',
        backgroundColor: this.fromBattle ? '#2eae5a' : '#3a7bff',
        padding: { x: 22, y: 6 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerdown', () => {
      if (this.fromBattle) {
        this.scene.stop();
        this.scene.resume('Battle'); // 멈춘 자리에서 이어서
      } else this.scene.start('StageSelect');
    });
  }

  private gridH = GRID_H; // 영웅 탭은 아래 진화 줄 자리만큼 낮게
  private gridTop = GRID_TOP;
  private cellMax = 110; // 칸 최대 높이(유닛 탭은 묶음별 6칸 이하라 크게)

  /** 탭 안 묶음(소분류) — 한 화면 카드를 줄여 크게 보여 줌 */
  private static weaponGroup: 'attack' | 'support' = 'attack';
  private static heroGroup: 'hero' | 'skill' = 'hero';

  private subTabs(list: { key: string; label: string; up?: boolean }[], cur: string, set: (k: string) => void): void {
    list.forEach((g, gi) => {
      const on = g.key === cur;
      const t = this.add
        .text(640 + (gi - (list.length - 1) / 2) * 170, GRID_TOP + 12, `${g.label}${g.up ? ' ⬆' : ''}`, {
          fontFamily: 'sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          color: on ? '#1a2338' : '#cfe0ff',
          backgroundColor: on ? '#ffd34d' : '#26324e',
          padding: { x: 14, y: 4 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        if (on) return;
        set(g.key);
        sfx(this, 'click');
        this.render();
      });
      this.layer.add(t);
    });
  }

  private render(): void {
    this.layer.removeAll(true);
    // 모든 탭 — 묶음 줄 아래 큰 카드(영웅 묶음은 아래 진화 줄 자리, 기지는 아래 성 진화 줄 자리만큼 낮게)
    this.gridTop = this.tab === 'base' ? GRID_TOP : GRID_TOP + SUB_H; // 기지 탭은 묶음 줄 없음
    this.gridH = this.tab === 'hero' && UpgradeScene.heroGroup === 'hero' ? 372 - SUB_H : this.tab === 'base' ? 380 : GRID_H - SUB_H;
    this.cellMax = 160;
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
    const h = Math.min(this.cellMax, this.gridH / rows);
    return { x: i % 2 === 0 ? 330 : 950, y: this.gridTop + h / 2 + Math.floor(i / 2) * h, h };
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
    skin?: { label: string; color: number; onClick: () => void }, // 👗 스킨 버튼
    chip?: { label: string; color: number; onClick: () => void; pulse?: boolean }, // 🃏 카드 랭크(제목 줄 오른쪽)
    look?: string, // 큰 칸이면 아이콘 대신 이 그림(전신, 대기 동작)
    ms?: { text: string; ratio: number }, // 🎁 다음 보상 진행 막대
    badges?: { label: string; color: number; onClick?: () => void; pulse?: boolean }[] // 🏷️ 등급 · 🔀 갈래
  ): void {
    const { x, y, h } = this.cell(i, count);
    const parts: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(x, y, 600, h - 8, 0x1a2338).setStrokeStyle(2, 0x33406a),
    ];
    if (h >= 130) {
      this.bigCard(parts, x, y, h, icon, title, desc, btnLabel, canUp, dim, onUp, extra, skin, chip, look, ms, badges);
      return;
    }
    // 3줄: 제목(크게) / 수치 / 스킬·스킨 — 휴대폰에서도 잘 보이게 큰 글씨·밝은 색·검은 테두리
    const tall = h >= 86;
    const l1 = tall ? y - 24 : y - 14;
    const l2 = tall ? y + 2 : y + 12;
    const l3 = y + 27;
    if (icon) parts.push(icon.setPosition(x - 260, y).setDisplaySize(tall ? 58 : 48, tall ? 58 : 48).setAlpha(dim ? 0.5 : 1));
    parts.push(
      this.add.text(x - 222, l1, title, { fontFamily: 'sans-serif', fontSize: '21px', fontStyle: 'bold', color: dim ? '#aab6c8' : '#ffffff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0, 0.5),
      this.add.text(x - 222, l2, desc, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#d6e2f5', wordWrap: { width: 380 } }).setOrigin(0, 0.5)
    );
    if (skin) {
      const sb = this.add
        .text(x + 110, tall ? l3 : y + 14, skin.label, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', backgroundColor: `#${skin.color.toString(16).padStart(6, '0')}`, padding: { x: 7, y: 3 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      sb.on('pointerdown', skin.onClick);
      parts.push(sb);
    }
    if (chip) {
      const cb = this.add
        .text(x + 110, l1, chip.label, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', backgroundColor: `#${chip.color.toString(16).padStart(6, '0')}`, padding: { x: 7, y: 3 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      cb.on('pointerdown', chip.onClick);
      if (chip.pulse) this.tweens.add({ targets: cb, scale: 1.12, duration: 420, yoyo: true, repeat: -1 });
      parts.push(cb);
    }
    if (extra) parts.push(this.add.text(tall ? x - 222 : x - 70, tall ? l3 : y - 14, extra, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ffe680' }).setOrigin(0, 0.5));
    const btn = this.add
      .rectangle(x + 232, y, 118, h - 20, canUp ? 0x2f7a4d : 0x3a3f55)
      .setStrokeStyle(2, canUp ? 0x5cff9e : 0x555)
      .setInteractive({ useHandCursor: true });
    const btnText = this.add
      .text(x + 232, y, btnLabel, { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#fff', align: 'center', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5);
    btn.on('pointerdown', onUp);
    parts.push(btn, btnText);
    this.layer.add(parts);
  }

  private renderUnits(): void {
    const keys = Object.keys(UNITS);
    // 🛡️ 근접 · 원거리 · 설치물 — 고른 묶음만 크게
    this.subTabs(
      UNIT_GROUPS.map((g) => {
        const n = keys.filter((k) => unitGroup(UNITS[k]) === g.key);
        return { key: g.key, label: `${g.label} ${n.length}`, up: n.some((k) => (meta.ownsUnit(k) ? meta.canUpgrade(k) || meta.canEvolve(k) : false)) };
      }),
      UpgradeScene.group,
      (k) => (UpgradeScene.group = k as UnitGroup)
    );
    const shown = keys.filter((k) => unitGroup(UNITS[k]) === UpgradeScene.group);
    shown.forEach((key, i) => {
      const u = UNITS[key];
      const owned = meta.ownsUnit(key);
      const price = unitPrice(keys.indexOf(key)); // 값은 전체 순서 기준 그대로
      const lv = meta.level(key);
      const tier = meta.tier(key);
      const look = owned ? ensureSkin(this, key, meta.equippedSkin(key), tier) : key; // 👗 착용 스킨 · ⭐ 진화 단계 얼굴
      this.needEvolutionArt(key, tier);
      const icon = this.textures.exists(iconKey(look)) ? this.add.image(0, 0, iconKey(look)) : null;
      // ⭐ 돌파 — 이 단계 최고 레벨이면 강화 대신 진화(골드 + 그 유닛 카드 조각)
      const next = nextUnitTier(tier);
      const evo = owned && readyToEvolve(lv, tier);
      const pk = meta.perks(key); // ⭐ 진화(단계·등급·갈래)
      const grp = unitGroup(u);
      const st = (base: number, l: number, m: number, hp = false): number => Math.round(scaleStat(base, l) * m * milestoneBonus(l, grp).stats * (hp ? milestoneBonus(l, grp).hp : 1)); // ⭐ 진화 · 🎁 보상 포함(근접 체력 보상)
      const have = meta.shards[key] ?? 0;
      const cost = evoCost(key, tier); // 🏷️ 등급별 진화 비용
      const nm = nextMilestone(lv, UNIT_TIERS[tier].min, grp);
      const ms = owned && !evo ? { text: `🎁 Lv${nm.lv} ${nm.text}`, ratio: nm.ratio } : undefined;
      const desc =
        evo && next
          ? `⭐ ${next.name} 진화! ${tier + 1 === BRANCH_TIER ? '🔀 공격형·방어형 고르기' : perkText(key, tier + 1)}\n${cost?.shards ? `🃏 조각 ${have}/${cost.shards}${have < cost.shards ? ' — 보물 상자에서 모아요' : ' ✅'}` : '골드만 있으면 바로 진화!'}`
          : `❤️ ${st(u.hp, lv, pk.hp, true)}  ⚔️ ${st(u.atk, lv, pk.atk)}  ▶  ❤️ ${st(u.hp, lv + 1, pk.hp, true)}  ⚔️ ${st(u.atk, lv + 1, pk.atk)}${next ? `   ⭐ Lv${levelCap(tier)}에 ${next.name} 진화` : '   🔥 최고 단계'}`;
      this.card(
        i,
        shown.length,
        icon,
        `${u.name} ${starText(tier)} Lv.${lv}`,
        desc,
        !owned ? `🛒 구매\n🪙${price}` : evo && cost ? `⭐ 진화\n🪙${cost.gold}` : `강화 🪙${meta.nextCost(key)}`,
        !owned ? meta.gold >= price : evo ? meta.canEvolve(key) : meta.canUpgrade(key),
        !owned,
        () => {
          if (!owned) {
            if (meta.buyUnit(key, price)) {
              sfx(this, 'levelup');
              this.render();
              if (!meta.activeDeck(keys).includes(key)) this.toast(`⚔️ 덱이 가득 찼어요 — 출전 준비 화면에서 ${u.name}을(를) 덱에 넣어요`);
            }
            return;
          }
          if (evo && next && cost) {
            if (!meta.canEvolve(key)) {
              if (have < cost.shards) this.toast(`🃏 ${u.name} 조각이 ${cost.shards - have}개 더 필요해요 — 보물 상자·광고 상자에서 모아요`);
              else this.toast(`🪙 골드가 ${cost.gold - meta.gold} 부족해요`);
              return;
            }
            const done = (b?: Branch): void => {
              if (!meta.evolve(key, b)) return;
              this.render();
              const t = UNIT_TIERS[meta.tier(key)];
              this.evolveFx(`${u.name} ${'★'.repeat(Math.min(5, t.stars))} ${t.name}`); // ⭐ 진화!
              this.toast(`💪 ${perkText(key, meta.tier(key))}${b ? ` · ${BRANCH_INFO[b].name}` : ''}`);
            };
            if (tier + 1 === BRANCH_TIER) this.openBranchPicker(key, done); // 🔀 ★4 — 갈래 고르고 진화
            else done();
            return;
          }
          const got = milestonesAt(meta.level(key));
          if (meta.upgrade(key)) {
            sfx(this, 'weapon');
            this.render();
            if (milestonesAt(meta.level(key)) > got) {
              sfx(this, 'levelup');
              this.toast(`🎁 ${u.name} Lv${meta.level(key)} 보상! ${MILESTONE_TEXT[milestoneKind(got, grp)]}`);
            }
          }
        },
        this.skillLabel(key, lv),
        owned ? this.skinButton(key) : undefined,
        owned ? this.rankChip(key) : undefined,
        look,
        ms,
        this.unitBadges(key, owned, tier)
      );
    });
  }

  /** 🏷️ 등급 배지 + 🔀 갈래 배지(★4부터 — 아직 안 골랐으면 반짝, 누르면 고르기/바꾸기) */
  private unitBadges(key: string, owned: boolean, tier: number): { label: string; color: number; onClick?: () => void; pulse?: boolean }[] {
    const g = GRADE_INFO[gradeOf(key)];
    const out: { label: string; color: number; onClick?: () => void; pulse?: boolean }[] = [{ label: g.name, color: g.color }];
    if (owned && tier >= BRANCH_TIER) {
      const b = meta.branchOf(key);
      out.push({
        label: b ? BRANCH_INFO[b].name : '🔀 갈래 고르기!',
        color: b ? BRANCH_INFO[b].color : 0xe8a000,
        pulse: !b,
        onClick: () =>
          this.openBranchPicker(key, (nb) => {
            if (meta.setBranch(key, nb)) {
              sfx(this, 'levelup');
              this.toast(`🔀 ${UNITS[key].name} → ${BRANCH_INFO[nb].name}`);
            } else if (meta.branchOf(key) !== nb) this.toast(`🪙 갈래 바꾸기는 ${BRANCH_CHANGE_GOLD}골드가 필요해요`);
            this.render();
          }),
      });
    }
    return out;
  }

  /** 🔀 갈래 고르기 창 — 공격형 / 방어형 */
  private openBranchPicker(key: string, pick: (b: Branch) => void): void {
    const layer = this.add.container(0, 0).setDepth(250);
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.6).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.97).fillRoundedRect(300, 150, 680, 420, 30);
    layer.add([dim, g]);
    const cur = meta.branchOf(key);
    const change = !!cur && meta.tier(key) >= BRANCH_TIER;
    layer.add(this.add.text(640, 196, `🔀 ${UNITS[key].name} 갈래 ${change ? '바꾸기' : '고르기'}`, { fontFamily: 'sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#3a2a6a' }).setOrigin(0.5));
    layer.add(this.add.text(640, 234, change ? `바꾸기 🪙${BRANCH_CHANGE_GOLD}` : '★4 마스터부터 둘 중 하나 — 나중에 골드로 바꿀 수 있어요', { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#8a7aa8' }).setOrigin(0.5));
    (['atk', 'def'] as Branch[]).forEach((b, i) => {
      const info = BRANCH_INFO[b];
      const x = 480 + i * 320;
      const c = this.add.container(x, 380);
      const bg = this.add.graphics();
      const on = cur === b;
      bg.fillStyle(on ? 0xf0f0f0 : 0xf6f6fa, 1).fillRoundedRect(-140, -110, 280, 220, 20);
      bg.lineStyle(on ? 6 : 4, info.color, 1).strokeRoundedRect(-140, -110, 280, 220, 20);
      c.add(bg);
      c.add(this.add.text(0, -70, info.name, { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'bold', color: `#${info.color.toString(16).padStart(6, '0')}` }).setOrigin(0.5));
      c.add(this.add.text(0, 0, info.desc.replace(' (', '\n('), { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#3a3a5a', align: 'center', wordWrap: { width: 250 } }).setOrigin(0.5));
      c.add(this.add.text(0, 80, on ? '✔ 지금 갈래' : '고르기', { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff', backgroundColor: on ? '#9098a8' : `#${info.color.toString(16).padStart(6, '0')}`, padding: { x: 18, y: 6 } }).setOrigin(0.5));
      if (!on) {
        const hit = this.add.rectangle(0, 0, 280, 220, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
        hit.on('pointerdown', () => {
          layer.destroy();
          pick(b);
        });
        c.add(hit);
      }
      layer.add(c);
    });
    const close = this.add.text(950, 176, '✕', { fontFamily: 'sans-serif', fontSize: '36px', fontStyle: 'bold', color: '#7a6aa8', padding: { x: 8, y: 4 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerdown', () => layer.destroy());
    dim.on('pointerdown', () => layer.destroy());
    layer.add(close);
  }

  private static boxes = new Map<string, { left: number; top: number; right: number; bottom: number } | null>();

  /** 프레임에서 그림이 있는 칸(투명 여백 제외) — 한 번 재고 기억 */
  private contentBox(tex: string, frame: number): { left: number; top: number; right: number; bottom: number } | null {
    const id = `${tex}#${frame}`;
    const hit = UpgradeScene.boxes.get(id);
    if (hit !== undefined) return hit;
    let box: { left: number; top: number; right: number; bottom: number } | null = null;
    try {
      const fr = this.textures.getFrame(tex, frame);
      const src = fr.source.image as CanvasImageSource;
      const w = fr.cutWidth;
      const h = fr.cutHeight;
      const cv = document.createElement('canvas');
      cv.width = w;
      cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(src, fr.cutX, fr.cutY, w, h, 0, 0, w, h);
      const px = ctx.getImageData(0, 0, w, h).data;
      let l = w, t = h, r = -1, b = -1;
      for (let yy = 0; yy < h; yy++) {
        for (let xx = 0; xx < w; xx++) {
          if (px[(yy * w + xx) * 4 + 3] > 40) {
            if (xx < l) l = xx;
            if (xx > r) r = xx;
            if (yy < t) t = yy;
            if (yy > b) b = yy;
          }
        }
      }
      if (r >= 0) box = { left: l, top: t, right: r + 1, bottom: b + 1 };
    } catch {
      box = null;
    }
    UpgradeScene.boxes.set(id, box);
    return box;
  }

  /** 큰 칸 — 왼쪽 무대에 전신 그림(대기 동작) · 큰 제목 · 수치 · 스킬, 오른쪽 위 랭크 · 아래 강화 버튼 */
  private bigCard(
    parts: Phaser.GameObjects.GameObject[],
    x: number,
    y: number,
    h: number,
    icon: Phaser.GameObjects.Image | null,
    title: string,
    desc: string,
    btnLabel: string,
    canUp: boolean,
    dim: boolean,
    onUp: () => void,
    extra: string,
    skin?: { label: string; color: number; onClick: () => void },
    chip?: { label: string; color: number; onClick: () => void; pulse?: boolean },
    look?: string,
    ms?: { text: string; ratio: number },
    badges?: { label: string; color: number; onClick?: () => void; pulse?: boolean }[]
  ): void {
    const sx = x - 222; // 무대 가운데
    const stageW = 148;
    const stageH = h - 22;
    parts.push(this.add.rectangle(sx, y, stageW, stageH, 0x0f1626).setStrokeStyle(1, 0x2a3656));
    parts.push(this.add.ellipse(sx, y + stageH / 2 - 16, 96, 16, 0x000000, 0.4)); // 발밑 그림자
    const d = look ? spriteOfLook(look) : null;
    if (d && look && this.textures.exists(textureKey(look))) {
      // 그림이 실제로 차지하는 칸(빈 여백 제외)을 무대에 꽉 차게 — 발은 무대 바닥에
      const f0 = d.anims.idle!.frames[0];
      const box = this.contentBox(textureKey(look), f0) ?? { left: 0, top: 0, right: d.frameWidth, bottom: d.footY };
      const grow = 0.88 + (0.12 * meta.tier(unitOfKey(look))) / MAX_TIER; // ⭐ 진화할수록 아주 조금씩 크게(★1 0.88 → 초월 7 1.0)
      const sc = Math.min((stageH - 26) / Math.max(1, d.footY - box.top), (stageW - 14) / Math.max(1, box.right - box.left), d.scale * 4) * grow;
      const spr = this.add
        .sprite(sx - ((box.left + box.right) / 2 - d.frameWidth / 2) * sc, y + stageH / 2 - 14, textureKey(look), f0)
        .setOrigin(0.5, d.footY / d.frameHeight)
        .setScale(sc)
        .setAlpha(dim ? 0.45 : 1);
      if (dim) spr.setTint(0x8890a0);
      else if (this.anims.exists(animKey(look, 'idle'))) spr.play(animKey(look, 'idle'));
      parts.push(spr);
      icon?.destroy();
    } else if (icon) parts.push(icon.setPosition(sx, y).setDisplaySize(96, 96).setAlpha(dim ? 0.5 : 1));
    else {
      const em = title.split(' ')[0]; // 👑 · ⭕ · 🍖 처럼 제목 앞 이모지
      if (em && !/[가-힣A-Za-z0-9]/.test(em)) parts.push(this.add.text(sx, y - 4, em, { fontSize: '58px', padding: { top: 16, bottom: 6 } }).setOrigin(0.5).setAlpha(dim ? 0.5 : 1));
    }
    const tx = x - 136;
    parts.push(
      this.add.text(tx, y - h / 2 + 30, title, { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: dim ? '#aab6c8' : '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0, 0.5),
      this.add.text(tx, y - 4, desc.replace(/\s+⭐/, '\n⭐'), { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#d6e2f5', wordWrap: { width: 300 }, lineSpacing: 2 }).setOrigin(0, 0.5)
    );
    if (ms) {
      // 🎁 다음 보상 — 글씨 + 작은 막대
      parts.push(this.add.text(tx, y + 27, ms.text, { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#9ad8ff' }).setOrigin(0, 0.5));
      parts.push(this.add.rectangle(tx + 210, y + 27, 90, 8, 0x0f1626).setOrigin(0, 0.5).setStrokeStyle(1, 0x3a4a6a));
      parts.push(this.add.rectangle(tx + 210, y + 27, Math.max(2, 90 * ms.ratio), 8, 0x5ab8ff).setOrigin(0, 0.5));
    }
    if (extra) parts.push(this.add.text(tx, y + h / 2 - 30, extra, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffe680', wordWrap: { width: 300 } }).setOrigin(0, 0.5));
    const pill = (label: string, color: number, px: number, py: number, fn: () => void): Phaser.GameObjects.Text => {
      const t = this.add
        .text(px, py, label, { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#ffffff', backgroundColor: `#${color.toString(16).padStart(6, '0')}`, padding: { x: 7, y: 3 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', fn);
      parts.push(t);
      return t;
    };
    if (chip) {
      const cb = pill(chip.label, chip.color, x + 232, y - h / 2 + 28, chip.onClick);
      if (chip.pulse) this.tweens.add({ targets: cb, scale: 1.12, duration: 420, yoyo: true, repeat: -1 });
    }
    if (skin) pill(skin.label, skin.color, sx + stageW / 2 - 30, y - stageH / 2 + 16, skin.onClick); // 무대 오른쪽 위
    // 🏷️ 등급(무대 왼쪽 위) · 🔀 갈래(무대 아래)
    (badges ?? []).forEach((bd, bi) => {
      const t = pill(bd.label, bd.color, bi === 0 ? sx - stageW / 2 + 26 : sx, bi === 0 ? y - stageH / 2 + 16 : y + stageH / 2 - 14, bd.onClick ?? (() => {}));
      if (!bd.onClick) t.disableInteractive();
      if (bd.pulse) this.tweens.add({ targets: t, scale: 1.12, duration: 420, yoyo: true, repeat: -1 });
    });
    const by = y + 14;
    const btn = this.add
      .rectangle(x + 232, by, 118, Math.min(84, h - 64), canUp ? 0x2f7a4d : 0x3a3f55)
      .setStrokeStyle(2, canUp ? 0x5cff9e : 0x555)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onUp);
    parts.push(
      btn,
      this.add.text(x + 232, by, btnLabel, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#fff', align: 'center', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5)
    );
    this.layer.add(parts);
  }

  /** 🃏 카드 랭크 칩 — 조각이 모이면 눌러서 랭크업(체력·공격 +6%) */
  private rankChip(key: string): { label: string; color: number; onClick: () => void; pulse?: boolean } {
    const r = meta.rank(key);
    const have = meta.shards[key] ?? 0;
    const need = rankUpCost(r);
    const ready = need !== null && have >= need;
    return {
      label: need === null ? `🃏 R${RANK_MAX} MAX` : ready ? `🃏 랭크업!` : `🃏 R${r} ${have}/${need}`,
      color: ready ? 0x2fa25a : r > 0 ? 0x8a5ad8 : 0x4a5578,
      pulse: ready,
      onClick: () => {
        if (meta.rankUp(key)) {
          sfx(this, 'levelup');
          this.render();
          this.evolveFx(`🃏 ${UNITS[key].name} 랭크 ${meta.rank(key)}! ❤️⚔️ ×${rankMult(meta.rank(key)).toFixed(2)}`, '');
        } else this.toast(need === null ? '🃏 최고 랭크예요' : `🃏 조각 ${need - have}개 더 필요 — 🎁 상자에서 모아요`);
      },
    };
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
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.55).setInteractive();
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
      const look = o.id === '?' ? null : ensureSkin(this, key, o.id, meta.tier(key)); // ⭐ 지금 진화 단계로 미리보기
      const def = look ? spriteOfLook(look, key) : null;
      if (look && def && this.textures.exists(textureKey(look))) {
        // 그림마다 여백이 달라 크기가 들쭉날쭉 → 실제 그림 높이로 맞추고, 등급이 오를수록 아주 조금씩 크게(기본 1 · 레어 1.04 · 전설 1.08)
        const f0 = def.anims.idle!.frames[0];
        const box = this.contentBox(textureKey(look), f0) ?? { left: 0, top: 0, right: def.frameWidth, bottom: def.frameHeight };
        const grow = o.id === 'legend' ? 1.08 : o.id ? 1.04 : 1;
        const sc = Math.min((96 * grow) / Math.max(1, box.bottom - box.top), (170 * grow) / Math.max(1, box.right - box.left));
        const img = this.add
          .image(x - ((box.left + box.right) / 2 - def.frameWidth / 2) * sc, y + 14, textureKey(look), f0)
          .setOrigin(0.5, box.bottom / def.frameHeight) // 발을 같은 줄에
          .setScale(sc);
        layer.add(img);
      } else {
        layer.add(this.add.text(x, y - 40, '❔', { fontSize: '54px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5).setAlpha(0.5));
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
    this.subTabs(
      [
        { key: 'hero', label: '👑 영웅·장비' },
        { key: 'skill', label: `✨ 영웅 스킬 ${HERO_SKILLS.length}` },
      ],
      UpgradeScene.heroGroup,
      (k) => (UpgradeScene.heroGroup = k as 'hero' | 'skill')
    );
    const skillTab = UpgradeScene.heroGroup === 'skill';
    const count = skillTab ? HERO_SKILLS.length : 4; // 영웅 · 오라 · ⚔️ 무기 · 💍 반지 / 스킬
    const pct = (m: number): string => `+${Math.round((m - 1) * 100)}%`;
    const up = (key: string, kind: 'hero' | 'aura' | 'skill', max: number): void => {
      const before = heroTier(meta.heroLevel('hero'));
      if (meta.upgradeHero(key, heroUpCost(kind, meta.heroLevel(key)), max)) {
        sfx(this, 'weapon');
        this.render();
        const after = heroTier(meta.heroLevel('hero'));
        if (after > before) this.evolveFx(HERO_TIERS[after].name); // ✨ 진화!
      }
    };
    const row = (i: number, key: string, kind: 'hero' | 'aura' | 'skill', max: number, title: string, desc: string, look?: string): void => {
      const lv = meta.heroLevel(key);
      const cost = heroUpCost(kind, lv);
      const maxed = lv >= max;
      this.card(i, count, null, `${title}  Lv.${lv}${maxed ? ' (MAX)' : ''}`, desc, maxed ? 'MAX' : `강화 🪙${cost}`, !maxed && meta.gold >= cost, false, () => up(key, kind, max), '', undefined, undefined, look);
    };
    const hl = meta.heroLevel('hero');
    const nt = nextHeroTier(hl);
    if (skillTab) {
      HERO_SKILLS.forEach((sk, j) => this.heroSkillCard(sk, j, count, row));
      return;
    }
    // 👑 지금 진화 단계 영웅 그림(전신, 대기 동작) — 그림이 아직 없으면 아래 단계 그림
    const heroLook = [HERO_TIERS[heroTier(hl)].look, ...HERO_FALLBACK_LOOKS].find((l) => this.textures.exists(textureKey(l)));
    row(0, 'hero', 'hero', HERO_MAX_LV, `👑 ${HERO_TIERS[heroTier(hl)].name}`, `❤️·⚔️ ${pct(heroLvMult(hl))} → ${pct(heroLvMult(hl + 1))}${nt ? `  ·  Lv${nt.min} 진화` : ''}`, heroLook);
    this.heroEvolution(hl);
    const al = meta.heroLevel('aura');
    row(1, 'aura', 'aura', AURA_MAX_LV, '⭕ 오라 크기', `오라 반지름 ${AURA_RADIUS + auraBonus(al)}  →  ${AURA_RADIUS + auraBonus(al + 1)}`);
    this.equipCard(2, count, 'weapon'); // 🛡️ 영웅 장비
    this.equipCard(3, count, 'ring');
  }

  /** 👑 영웅 스킬 카드(해금 / 강화) */
  private heroSkillCard(
    sk: (typeof HERO_SKILLS)[number],
    i: number,
    count: number,
    row: (i: number, key: string, kind: 'hero' | 'aura' | 'skill', max: number, title: string, desc: string) => void
  ): void {
    const pct = (m: number): string => `+${Math.round((m - 1) * 100)}%`;
    {
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
    }
  }

  /** 🛡️ 장비 칸 카드(무기·반지) — 누르면 고르기 창 */
  private equipCard(i: number, count: number, kind: 'weapon' | 'ring'): void {
    const list = kind === 'weapon' ? HERO_WEAPONS : RINGS;
    const cur = kind === 'weapon' ? meta.weaponEq : meta.ringEq;
    const def = list.find((d) => d.key === cur) ?? null;
    const g = def ? meta.equipGrade(def.key) : 0;
    const tex = textureKey(kind === 'weapon' ? 'equip_weapon_icons' : 'equip_ring_icons');
    const icon = def && this.textures.exists(tex) ? this.add.image(0, 0, tex, def.frame) : null;
    const owned = list.filter((d) => meta.equipGrade(d.key) > 0).length;
    this.card(
      i,
      count,
      icon,
      def ? `${kind === 'weapon' ? '⚔️' : '💍'} ${def.name} ${'★'.repeat(g)}` : '💍 반지: 비어 있음',
      def ? `${def.desc(g)} · ${GRADE_NAMES[g - 1]}` : '🎁 보물 상자에서 반지를 얻어요',
      `${kind === 'weapon' ? '무기' : '반지'} 바꾸기\n(${owned}/${list.length})`,
      true,
      false,
      () => this.openEquipPicker(kind)
    );
  }

  /** 🛡️ 장비 고르기 창 — 장착 · 골드로 등급 올리기, 없는 장비는 그림자 */
  private openEquipPicker(kind: 'weapon' | 'ring'): void {
    const list = kind === 'weapon' ? HERO_WEAPONS : RINGS;
    const tex = textureKey(kind === 'weapon' ? 'equip_weapon_icons' : 'equip_ring_icons');
    const layer = this.add.container(0, 0).setDepth(200);
    const close = (): void => {
      layer.destroy();
      this.render();
    };
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.7).setInteractive();
    dim.on('pointerdown', close);
    const panel = this.add.rectangle(640, 372, 1000, 600, 0x141c30).setStrokeStyle(3, 0x4a6ad8).setInteractive();
    layer.add([dim, panel]);
    layer.add(this.add.text(640, 98, kind === 'weapon' ? '⚔️ 영웅 무기 — 🔨 J 스킬이 바뀌어요' : '💍 반지 — 늘 켜져 있는 능력', { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0.5));
    const x = this.add.text(1112, 98, '✕', { fontFamily: 'sans-serif', fontSize: '30px', color: '#fff' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    x.on('pointerdown', close);
    layer.add(x);
    const cur = kind === 'weapon' ? meta.weaponEq : meta.ringEq;
    list.forEach((d, i) => {
      const y = 158 + i * 86;
      const g = meta.equipGrade(d.key);
      const have = g > 0;
      const on = cur === d.key;
      const row: Phaser.GameObjects.GameObject[] = [this.add.rectangle(640, y, 960, 78, on ? 0x24345a : 0x1a2338).setStrokeStyle(2, on ? 0xffd34d : 0x33406a)];
      row.push(this.add.circle(200, y, 33, 0x0b0f1a).setStrokeStyle(4, have ? GRADE_COLORS[g - 1] : 0x3a3f4a));
      if (this.textures.exists(tex)) {
        const im = this.add.image(200, y, tex, d.frame).setDisplaySize(56, 56);
        if (!have) im.setTint(0x10141f).setTintMode(Phaser.TintModes.FILL).setAlpha(0.8);
        row.push(im);
      }
      row.push(
        this.add.text(250, y - 14, have ? `${d.name}  ${'★'.repeat(g)}${'☆'.repeat(EQUIP_MAX - g)}  ${GRADE_NAMES[g - 1]}` : `${d.name}  🔒`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: have ? '#ffffff' : '#7c8698' }).setOrigin(0, 0.5),
        this.add.text(250, y + 16, have ? d.desc(g) : '🎁 보물 상자에서 얻어요(금·전설 상자일수록 잘 나와요)', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: have ? '#d6e2f5' : '#6a7488' }).setOrigin(0, 0.5)
      );
      const btn = (bx: number, label: string, color: string, ok: boolean, fn: () => void): void => {
        const t = this.add
          .text(bx, y, label, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff', backgroundColor: ok ? color : '#3a3f55', padding: { x: 12, y: 8 }, align: 'center' })
          .setOrigin(0.5);
        if (ok) t.setInteractive({ useHandCursor: true }).on('pointerdown', fn);
        row.push(t);
      };
      if (have) {
        if (on && kind === 'ring')
          btn(905, '빼기', '#8a3a3a', true, () => {
            meta.unequipRing();
            layer.destroy();
            this.openEquipPicker(kind);
          });
        else
          btn(905, on ? '✅ 장착 중' : '장착', '#2f7a4d', !on, () => {
            meta.equipItem(d.key);
            sfx(this, 'click');
            layer.destroy();
            this.openEquipPicker(kind);
          });
        const cost = equipUpCost(g);
        btn(1030, cost === null ? 'MAX' : `★ 강화\n🪙${cost}`, '#8a5ad8', cost !== null && meta.gold >= cost, () => {
          if (meta.upgradeEquip(d.key)) {
            sfx(this, 'levelup');
            this.goldText.setText(`보유 🪙 ${meta.gold}`);
            layer.destroy();
            this.openEquipPicker(kind);
          }
        });
      }
      layer.add(row);
    });
  }

  /** 👑 진화 단계 줄 — 5단계 그림(지금 단계 강조, 아직 못 간 단계는 그림자) */
  private heroEvolution(lv: number): void {
    // 아직 안 받은 단계 그림은 받고 나서 다시 그림
    const missing = HERO_TIERS.find((t) => spriteOf(t.look) && !this.textures.exists(textureKey(t.look)));
    if (missing) {
      loadLook(this, missing.look, () => {
        if (this.tab === 'hero' && this.scene.isActive()) this.render();
      });
    }
    const cur = heroTier(lv);
    const y = 562;
    this.layer.add(this.add.rectangle(640, y, 1180, 128, 0x141c30).setStrokeStyle(2, 0x33406a));
    HERO_TIERS.forEach((t, i) => {
      const x = 640 + (i - 2) * 230;
      const d = spriteOf(t.look);
      if (d && this.textures.exists(textureKey(t.look))) {
        const img = this.add.image(x, y - 6, textureKey(t.look), d.anims.idle!.frames[0]);
        img.setScale(Math.min(88 / d.frameHeight, 150 / d.frameWidth));
        if (i > cur) img.setTint(0x0a0e18).setTintMode(Phaser.TintModes.FILL).setAlpha(0.8); // 아직 = 그림자
        this.layer.add(img);
        if (i === cur) this.tweens.add({ targets: img, y: y - 12, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
      const label = i > cur ? `🔒 Lv${t.min} ${t.name}` : `Lv${t.min} ${t.name}`;
      this.layer.add(
        this.add
          .text(x, y + 48, i === cur ? `▶ ${t.name} ◀` : label, { fontFamily: 'sans-serif', fontSize: i === cur ? '17px' : '14px', fontStyle: 'bold', color: i === cur ? '#ffd34d' : i < cur ? '#9fb3d0' : '#5a6684' })
          .setOrigin(0.5)
      );
      if (i < HERO_TIERS.length - 1) this.layer.add(this.add.text(x + 115, y - 6, '›', { fontSize: '30px', color: '#4a5878' }).setOrigin(0.5));
    });
  }

  /** ⭐ 진화 단계 그림을 아직 안 받았으면 받고 다시 그림 */
  private needEvolutionArt(unit: string, tier: number): void {
    const inManifest = (k: string): boolean => !!spriteOf(k);
    const want = [evolvedKey(unit, tier, false, inManifest), meta.equippedSkin(unit) === 'legend' ? evolvedKey(unit, tier, true, inManifest) : null];
    const missing = want.find((k): k is string => !!k && !this.textures.exists(textureKey(k)));
    if (missing) loadLook(this, missing, () => this.scene.isActive() && this.render());
  }

  /** 짧은 안내(화면 아래쪽) */
  private toast(msg: string): void {
    const t = this.add
      .text(640, 640, msg, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffe680', backgroundColor: '#0d1424ee', padding: { x: 14, y: 8 } })
      .setOrigin(0.5)
      .setDepth(300);
    this.tweens.add({ targets: t, y: 610, alpha: 0, delay: 900, duration: 500, onComplete: () => t.destroy() });
  }

  /** ✨ 진화 연출 */
  private evolveFx(name: string, head = '✨ 진화!'): void {
    sfx(this, 'evolve');
    const flash = this.add.rectangle(640, 360, VIEW_W, 720, 0xfff6c0, 0.7).setDepth(300);
    this.tweens.add({ targets: flash, alpha: 0, duration: 700, onComplete: () => flash.destroy() });
    const t = this.add
      .text(640, 300, `${head} ${name} ✨`, { fontFamily: 'sans-serif', fontSize: head ? '52px' : '40px', fontStyle: 'bold', color: '#ffd34d', stroke: '#5a3a00', strokeThickness: 8 })
      .setOrigin(0.5)
      .setDepth(301)
      .setScale(0.3);
    this.tweens.add({ targets: t, scale: 1, duration: 450, ease: 'Back.easeOut' });
    this.tweens.add({ targets: t, alpha: 0, delay: 1600, duration: 500, onComplete: () => t.destroy() });
  }

  /** 🏰 기지 강화 — 인구 상한 · 소환 에너지(충전·상한) */
  private renderBase(): void {
    const count = BASE_UPGRADES.length + 2;
    // 🏰 성 레벨 · 🎯 성 공격 속도
    const cl = meta.castleLevel('castle');
    const rl = meta.castleLevel('castleRate');
    const g0 = allyCastleGun(cl, rl);
    const g1 = allyCastleGun(cl + 1, rl);
    const tier = allyCastleTier(cl);
    const next = ALLY_CASTLE_TIERS[tier + 1];
    const rows: { key: 'castle' | 'castleRate'; title: string; desc: string; extra?: string }[] = [
      {
        key: 'castle',
        title: `🏰 ${ALLY_CASTLE_TIERS[tier].name}  Lv.${cl}${cl >= CASTLE_MAX_LV ? ' (MAX)' : ''}`,
        desc: `❤️×${castleHpMult(cl).toFixed(1)} ⚔️${g0.dmg} 🎯${g0.range} ▶ ❤️×${castleHpMult(cl + 1).toFixed(1)} ⚔️${g1.dmg} 🎯${g1.range}`,
        extra: next ? `⭐ Lv${next.min} 진화 → ${next.name}` : '',
      },
      {
        key: 'castleRate',
        title: `🎯 성 공격 속도  Lv.${rl}${rl >= CASTLE_RATE_MAX_LV ? ' (MAX)' : ''}`,
        desc: `${g0.interval}초마다 발사  →  ${allyCastleGun(cl, rl + 1).interval}초`,
      },
    ];
    rows.forEach((r, i) => {
      const cost = meta.castleNextCost(r.key);
      this.card(i, count, null, r.title, r.desc, cost === null ? 'MAX' : `강화 🪙${cost}`, cost !== null && meta.gold >= cost, false, () => {
        const before = allyCastleTier(meta.castleLevel('castle'));
        if (meta.upgradeCastle(r.key)) {
          sfx(this, 'weapon');
          this.render();
          const after = allyCastleTier(meta.castleLevel('castle'));
          if (after > before) this.evolveFx(ALLY_CASTLE_TIERS[after].name); // ✨ 성 진화!
        }
      }, r.extra ?? '');
    });
    BASE_UPGRADES.forEach((b, j) => {
      const i = j + 2;
      const lv = meta.baseLevel(b.key);
      const cost = meta.baseNextCost(b.key);
      this.card(
        i,
        count,
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
    this.castleEvolution(cl);
  }

  /** 🏰 성 진화 단계 줄(그림이 있으면 그림, 없으면 이름만) */
  private castleEvolution(lv: number): void {
    const cur = allyCastleTier(lv);
    const y = 560;
    this.layer.add(this.add.rectangle(640, y, 1180, 120, 0x141c30).setStrokeStyle(2, 0x33406a));
    ALLY_CASTLE_TIERS.forEach((t, i) => {
      const x = 640 + (i - 2) * 230;
      const key = castleLook('ally', i);
      const d = spriteOf(key) ?? (i === 0 ? spriteOf('base_ally') : undefined);
      const tex = spriteOf(key) ? textureKey(key) : textureKey('base_ally');
      if (d && this.textures.exists(tex) && (i === 0 || spriteOf(key))) {
        const img = this.add.image(x, y - 10, tex, d.anims.idle!.frames[0]);
        img.setScale(Math.min(80 / d.frameHeight, 140 / d.frameWidth));
        if (i > cur) img.setTint(0x0a0e18).setTintMode(Phaser.TintModes.FILL).setAlpha(0.8);
        this.layer.add(img);
      } else {
        this.layer.add(this.add.text(x, y - 10, i > cur ? '🔒' : '🏰', { fontSize: '40px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5).setAlpha(i > cur ? 0.5 : 1));
      }
      this.layer.add(
        this.add
          .text(x, y + 44, i === cur ? `▶ ${t.name} ◀` : `${i > cur ? '🔒 ' : ''}Lv${t.min} ${t.name}`, { fontFamily: 'sans-serif', fontSize: i === cur ? '17px' : '14px', fontStyle: 'bold', color: i === cur ? '#ffd34d' : i < cur ? '#9fb3d0' : '#5a6684' })
          .setOrigin(0.5)
      );
      if (i < ALLY_CASTLE_TIERS.length - 1) this.layer.add(this.add.text(x + 115, y - 10, '›', { fontSize: '30px', color: '#4a5878' }).setOrigin(0.5));
    });
  }

  private renderWeapons(): void {
    const iconTex = textureKey('weapon_icons');
    const SUPPORT = new Set(['heal', 'freeze', 'guard', 'berserk']);
    const grp = (k: string): 'attack' | 'support' => (SUPPORT.has(k) ? 'support' : 'attack');
    const upOf = (g: string): boolean => WEAPONS.some((w, i) => grp(w.key) === g && meta.gold >= (meta.ownsWeapon(w.key) ? meta.weaponNextCost(w.key) : weaponPrice(i)));
    this.subTabs(
      [
        { key: 'attack', label: '💥 공격 5', up: upOf('attack') },
        { key: 'support', label: '✨ 지원 4', up: upOf('support') },
      ],
      UpgradeScene.weaponGroup,
      (k) => (UpgradeScene.weaponGroup = k as 'attack' | 'support')
    );
    const shown = WEAPONS.map((w, i) => ({ w, i })).filter((o) => grp(o.w.key) === UpgradeScene.weaponGroup);
    shown.forEach(({ w, i }, slot) => {
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
        slot,
        shown.length,
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
