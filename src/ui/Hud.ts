import Phaser from 'phaser';
import type { UnitStats } from '../types';
import { iconKey, textureKey } from '../systems/sprites';
import { WEAPONS } from '../systems/weapons';
import type { Synergy } from '../systems/synergy';
import { HERO_SKILLS } from '../systems/hero';
import { KIND_INFO, UNIT_COUNTER } from '../systems/counters';

export interface HudState {
  lv: number;
  gold: number;
  energy: number;
  energyMax: number;
  food: number;
  foodMax: number;
  linePos: number; // 0(우리 기지) ~ 1(적 기지)
  afford: Record<string, boolean>; // 유닛별 지금 소환 가능 여부
  cd: Record<string, number>; // ⏱️ 유닛별 소환 대기 남은 비율(0~1)
  beat: number; // ⏱️ 리듬 소환 마커 위치 0~1
  perfectWin: number; // 퍼펙트 허용 폭(중앙 ±)
  upg: Record<string, { lv: number; cost: number; afford: boolean }>; // 전장 실시간 강화
  weapons: ({ ratio: number; ready: boolean } | null)[]; // 특수 무기 게이지(구매 안 한 것 = null)
  good?: Record<string, boolean>; // ⚔️ 지금 전장에 상성 적이 있는 유닛
}

/** 🎓 처음 하는 사람에게 단계적으로 보여 줄 HUD 기능(systems/tutorial.ts) */
export interface HudFeatures {
  heroSkill: boolean;
  weapon: boolean;
  perfect: boolean;
}
const ALL_ON: HudFeatures = { heroSkill: true, weapon: true, perfect: true };

const UNIT_COLORS: Record<string, number> = {
  soldier: 0x4a9eff,
  archer: 0x5cff9e,
  knight: 0xb98cff,
  spear: 0x4ad0e0,
  mage: 0xd58cff,
  rogue: 0x6abf5a,
  cleric: 0xffe08a,
  earthmage: 0xd8a04a,
  darkmage: 0x9a5aff,
  shield: 0x9aa8c0,
  cavalry: 0xc8864a,
  cannon: 0xa0a8b8,
};

interface Slot {
  key: string;
  cx: number;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  cost: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Rectangle;
  face: Phaser.GameObjects.Image | null; // 얼굴 아이콘(없으면 색 네모만)
  upBtn: Phaser.GameObjects.Rectangle;
  upText: Phaser.GameObjects.Text;
  lvText: Phaser.GameObjects.Text;
  cdShade: Phaser.GameObjects.Rectangle; // ⏱️ 소환 대기 — 위에서부터 어둡게 덮음
  goodTag: Phaser.GameObjects.Text | null; // ⚔️ '유리!' 표시
  col: number;
}

interface WeaponButton {
  index: number;
  cx: number;
  cy: number;
  color: number;
  bg: Phaser.GameObjects.Arc;
  gauge: Phaser.GameObjects.Graphics;
  ring: Phaser.GameObjects.Arc; // 발사 가능 표시(깜빡임)
  icon: Phaser.GameObjects.Text | Phaser.GameObjects.Image; // 그림 아이콘(없으면 이모지)
  wasReady: boolean;
}

const WEAPON_R = 34;
export const HERO_PANEL_X = 1010; // 👑 영웅 스킬 버튼 x(적 성 그림 왼쪽 — 성 꼭대기·체력 바를 가리지 않게)
export const HERO_BTN_R = 40;
export const HERO_BTN_Y = 114; // 적 기지 그림(위쪽 ~165)보다 위
const W_CARD_W = 150; // 📱 특수 무기 카드(가로 스크롤)
const W_CARD_H = 92;
const W_CARD_CY = 658; // 화면 맨 아래(제스처 영역)에서 조금 위로
const DRAG_START = 24; // 이만큼 이상 끌어야 스크롤(그 아래는 탭)
const CARD_W = 140; // 📱 유닛 카드(가로 스크롤)
const CARD_H = 160;
const CARD_GAP = 8;
const CARD_CY = 528;
const UNIT_SLOTS = 12; // 유닛 칸 수(유닛 데이터보다 많으면 나머지는 잠금 '준비 중')
const ROW_X0 = 4; // 카드 줄 왼쪽 여백

/** 전투 HUD — 상단(LV·VS·골드) + 하단 2단(유닛 12슬롯 / 특수 무기 9버튼) + 에너지/식량 바 */
export class Hud {
  private scene: Phaser.Scene;
  private lvText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private vsBlue: Phaser.GameObjects.Rectangle;
  private vsRed: Phaser.GameObjects.Rectangle;
  private vsMark: Phaser.GameObjects.Triangle;
  private readonly vsX = 430;
  private readonly vsW = 360;

  private energyFill: Phaser.GameObjects.Rectangle;
  private energyText: Phaser.GameObjects.Text;
  private foodFill: Phaser.GameObjects.Rectangle;
  private foodText: Phaser.GameObjects.Text;

  private slots: Slot[] = [];
  private strip!: Phaser.GameObjects.Container; // 유닛 카드 줄(가로 스크롤)
  private dragged = false;
  private objs: Phaser.GameObjects.GameObject[] = []; // 이 HUD가 만든 오브젝트
  private offs: (() => void)[] = []; // 입력·업데이트 리스너 해제
  private weaponBtns: WeaponButton[] = [];
  private heroBtns: { bg: Phaser.GameObjects.Arc; shade: Phaser.GameObjects.Graphics; cx: number; cy: number; glow: Phaser.GameObjects.Arc; cost: Phaser.GameObjects.Text; owned: boolean }[] = [];
  private manaFill: Phaser.GameObjects.Rectangle | null = null;
  private manaText: Phaser.GameObjects.Text | null = null;
  private heroHpFill!: Phaser.GameObjects.Rectangle;
  private heroHpText!: Phaser.GameObjects.Text;
  private synergyText!: Phaser.GameObjects.Text;
  private beatMark: Phaser.GameObjects.Triangle | null = null;
  private readonly beatX = 470; // 인구 바(~440)와 에너지 바(840~) 사이
  private readonly beatW = 340;

  constructor(
    scene: Phaser.Scene,
    units: Record<string, UnitStats>,
    onSpawn: (type: string) => void,
    onUpgrade: (type: string) => void,
    onWeapon: (index: number) => void,
    weaponOwned: boolean[], // 무기별 보유 여부
    unitOwned: Record<string, boolean>, // 유닛별 보유 여부
    looks: Record<string, string> = {}, // 👗 스킨 적용 얼굴(유닛@스킨)
    onHeroSkill: (index: number) => void = () => {}, // 👑 영웅 스킬
    heroOwned: boolean[] = [true], // 👑 해금한 영웅 스킬
    features: HudFeatures = ALL_ON // 🎓 아직 안 열린 기능은 숨김
  ) {
    this.scene = scene;
    const before = new Set(scene.children.list); // destroy()용 — 이 HUD가 만든 것만 기억
    const d = 100;
    this.buildHeroPanel(onHeroSkill, heroOwned, d, features.heroSkill);
    scene.add.rectangle(640, 22, 1280, 44, 0x0d1424, 0.8).setDepth(d);
    this.synergyText = scene.add
      .text(12, 52, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#aef5ff', backgroundColor: '#0d1424cc', padding: { x: 8, y: 4 } })
      .setDepth(d + 1)
      .setVisible(false);
    this.lvText = scene.add.text(64, 22, 'LV 1', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0, 0.5).setDepth(d + 1);
    scene.add.rectangle(this.vsX + this.vsW / 2, 22, this.vsW + 4, 20, 0x000000, 0.5).setDepth(d);
    this.vsBlue = scene.add.rectangle(this.vsX, 22, this.vsW / 2, 16, 0x3aa0ff).setOrigin(0, 0.5).setDepth(d + 1);
    this.vsRed = scene.add.rectangle(this.vsX + this.vsW, 22, this.vsW / 2, 16, 0xff4a4a).setOrigin(1, 0.5).setDepth(d + 1);
    scene.add.text(this.vsX + this.vsW / 2, 22, 'VS', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(d + 2);
    this.vsMark = scene.add.triangle(this.vsX + this.vsW / 2, 36, 0, 8, 10, 8, 5, 0, 0xffffff).setDepth(d + 2);
    this.goldText = scene.add.text(808, 22, '🪙 0', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0, 0.5).setDepth(d + 1);

    // 하단 HUD 판(전장과 구분)
    scene.add.rectangle(640, 565, 1280, 310, 0x0b0f1a, 0.92).setDepth(d - 1);
    scene.add.rectangle(640, 410, 1280, 2, 0x3a4560).setDepth(d - 1);
    const by = 428;
    scene.add.rectangle(240, by, 400, 22, 0x000000, 0.5).setDepth(d);
    this.foodFill = scene.add.rectangle(42, by, 396, 18, 0xe0a24e).setOrigin(0, 0.5).setDepth(d + 1);
    this.foodText = scene.add.text(240, by, '', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(22, by, '🍖 인구', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0, 0.5).setDepth(d + 2);
    scene.add.rectangle(1040, by, 400, 22, 0x000000, 0.5).setDepth(d);
    this.energyFill = scene.add.rectangle(842, by, 396, 18, 0x4ac8e0).setOrigin(0, 0.5).setDepth(d + 1);
    this.energyText = scene.add.text(1040, by, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(1238, by, '⚡ 소환', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 3 }).setOrigin(1, 0.5).setDepth(d + 2);

    // ⏱️ 리듬 소환 바 (초록 중앙 = PERFECT) — 하단 HUD, 인구/에너지 바 사이
    const beatY = by + 4;
    if (features.perfect) {
      scene.add.text(this.beatX + this.beatW / 2, by - 15, '⏱️ 초록에 맞춰 소환 = PERFECT 강화!', { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffe14d' }).setOrigin(0.5).setDepth(d + 1);
      scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW + 4, 16, 0x000000, 0.5).setDepth(d);
      scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW, 12, 0x2a3348).setDepth(d + 1);
      scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW * 0.16, 12, 0x3fd06a).setDepth(d + 1); // 퍼펙트 존
      this.beatMark = scene.add.triangle(this.beatX + this.beatW / 2, beatY, 0, -10, 10, -10, 5, 2, 0xffffff).setDepth(d + 2);
    }

    // 하단 1단: 유닛 카드(큰 카드, 가로 스크롤) — 보유 유닛 먼저, 나머지는 잠금
    const keys = Object.keys(units).sort((x, y) => Number(!unitOwned[x]) - Number(!unitOwned[y]));
    while (keys.length < UNIT_SLOTS) keys.push('');
    const strip = scene.add.container(0, 0).setDepth(d);
    this.strip = strip;
    const cy = CARD_CY;
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      strip.add(o);
      return o;
    };
    const tap = (o: Phaser.GameObjects.Rectangle, fn: () => void): void => {
      o.setInteractive({ useHandCursor: true });
      o.on('pointerup', () => {
        if (!this.dragged) fn(); // 끌어서 넘긴 경우는 소환 안 함
      });
    };
    keys.forEach((key, i) => {
      const cx = ROW_X0 + CARD_W / 2 + i * (CARD_W + CARD_GAP);
      if (!key || !unitOwned[key]) {
        // 데이터 없음 = '준비 중' / 구매 안 함 = 얼굴 흐리게 + '강화에서 구매'
        add(scene.add.rectangle(cx, cy, CARD_W, CARD_H, 0x20242e).setStrokeStyle(2, 0x3a3f4a));
        if (key && scene.textures.exists(iconKey(key))) add(scene.add.image(cx, cy - 10, iconKey(key)).setDisplaySize(72, 72).setAlpha(0.25));
        add(scene.add.text(cx, cy - 10, '🔒', { fontSize: '30px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5).setAlpha(0.75));
        if (key) {
          add(scene.add.rectangle(cx, cy + 46, CARD_W - 10, 26, 0x000000, 0.5)); // 이름 판
          add(scene.add.text(cx, cy + 46, units[key].name, { fontFamily: 'sans-serif', fontSize: units[key].name.length >= 5 ? '17px' : '19px', fontStyle: 'bold', color: '#e6ecf5', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5));
        }
        add(scene.add.text(cx, cy + 68, key ? '🛒 강화에서 구매' : '준비 중', { fontFamily: 'sans-serif', fontSize: '14px', color: key ? '#a8b4c8' : '#6a7488' }).setOrigin(0.5));
        return;
      }
      const u = units[key];
      const col = UNIT_COLORS[key] ?? 0x4a9eff;
      const rect = add(scene.add.rectangle(cx, cy, CARD_W, CARD_H, 0x2a3348).setStrokeStyle(3, col));
      // 윗줄: 레벨(좌) · 전장 강화 버튼(우) / 가운데 얼굴 / 아래 이름 + 비용
      const lvText = add(scene.add.text(cx - CARD_W / 2 + 8, cy - 62, 'Lv1', { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0, 0.5));
      const icon = add(scene.add.rectangle(cx, cy - 6, 70, 70, col));
      const faceKey = scene.textures.exists(iconKey(looks[key] ?? key)) ? iconKey(looks[key] ?? key) : iconKey(key);
      const face = scene.textures.exists(faceKey) ? add(scene.add.image(cx, cy - 6, faceKey).setDisplaySize(70, 70)) : null;
      if (face) icon.setFillStyle(0x1a2133).setStrokeStyle(2, col); // 얼굴 뒤는 어두운 바탕 + 유닛 색 테두리
      add(scene.add.rectangle(cx, cy + 45, CARD_W - 10, 28, 0x000000, 0.55)); // 이름 판(휴대폰에서도 잘 보이게)
      const label = add(scene.add.text(cx, cy + 45, u.name, { fontFamily: 'sans-serif', fontSize: u.name.length >= 5 ? '19px' : '22px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5));
      const cost = add(scene.add.text(cx, cy + 67, `⚡${u.cost}  🍖${u.pop}`, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#cfe' }).setOrigin(0.5));
      tap(rect, () => onSpawn(key));
      // ⚔️ 상성 — 얼굴 오른쪽 아래에 강한 적 종류, 그 적이 전장에 있으면 '유리!'
      const ck = UNIT_COUNTER[key];
      if (ck) add(scene.add.text(cx + 30, cy + 22, `▶${KIND_INFO[ck].icon}`, { fontSize: '17px', backgroundColor: '#0d1424dd', padding: { x: 3, y: 1, top: 6 } }).setOrigin(0.5));
      const goodTag = ck ? add(scene.add.text(cx, cy - 36, '🎯 유리!', { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#ffe14d', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setVisible(false)) : null;
      // 🛠️ 전장 실시간 강화 버튼(카드 우상단) — 소환 탭과 분리
      const upBtn = add(scene.add.rectangle(cx + CARD_W / 2 - 36, cy - 62, 62, 28, 0x2f7a4d).setStrokeStyle(1, 0x5cff9e));
      const upText = add(scene.add.text(cx + CARD_W / 2 - 36, cy - 62, '⬆', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5));
      tap(upBtn, () => onUpgrade(key));
      const cdShade = add(scene.add.rectangle(cx, cy - CARD_H / 2, CARD_W, 0, 0x000000, 0.6).setOrigin(0.5, 0));
      this.slots.push({ key, cx, rect, label, cost, icon, face, upBtn, upText, lvText, cdShade, goodTag, col });
    });
    this.scroller(strip, cy, CARD_H, keys.length * (CARD_W + CARD_GAP) - CARD_GAP, d);

    // 하단 2단: 특수 무기 카드 9장(게이지가 차면 발사, 단축키 1~9) — 가로 스크롤
    const wStrip = scene.add.container(0, 0).setDepth(d);
    const wy = W_CARD_CY;
    if (!features.weapon) {
      scene.add.text(640, wy, '🔒 특수 무기 — 3관문에서 열려요', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#7c8aa0' }).setOrigin(0.5).setDepth(d);
    }
    if (features.weapon) WEAPONS.forEach((w, i) => {
      const x = ROW_X0 + W_CARD_W / 2 + i * (W_CARD_W + CARD_GAP);
      const cx = x - W_CARD_W / 2 + 8 + WEAPON_R; // 원(아이콘)은 카드 왼쪽
      const tx = cx + WEAPON_R + 8; // 글씨는 오른쪽
      const owned = weaponOwned[i];
      const card = scene.add.rectangle(x, wy, W_CARD_W, W_CARD_H, owned ? 0x1e2740 : 0x20242e).setStrokeStyle(2, owned ? 0x3a4560 : 0x33373f);
      const bg = scene.add.circle(cx, wy, WEAPON_R, 0x1a2133).setStrokeStyle(3, 0x3a4560);
      const num = scene.add
        .text(x - W_CARD_W / 2 + 4, wy - W_CARD_H / 2 + 4, String(i + 1), { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#3a2a10', backgroundColor: '#ffd34d', padding: { x: 4, y: 0 } })
        .setOrigin(0, 0);
      wStrip.add([card, bg]);
      if (!owned) {
        wStrip.add([
          scene.add.text(cx, wy, '🔒', { fontSize: '24px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5).setAlpha(0.6),
          scene.add.text(tx, wy - 12, w.name, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#7c8698' }).setOrigin(0, 0.5),
          scene.add.text(tx, wy + 14, '🛒 구매', { fontFamily: 'sans-serif', fontSize: '13px', color: '#7c8aa0' }).setOrigin(0, 0.5),
          num,
        ]);
        return;
      }
      const gauge = scene.add.graphics();
      const ring = scene.add.circle(cx, wy, WEAPON_R + 3).setStrokeStyle(3, w.color).setVisible(false);
      const iconTex = textureKey('weapon_icons'); // public/sprites 무기 아이콘 시트(프레임 i = i번째 무기)
      const icon = scene.textures.exists(iconTex)
        ? scene.add.image(cx, wy, iconTex, i).setDisplaySize(WEAPON_R * 1.45, WEAPON_R * 1.45)
        : scene.add.text(cx, wy, w.icon, { fontSize: '30px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5);
      const name = scene.add.text(tx, wy, w.name, { fontFamily: 'sans-serif', fontSize: w.name.length >= 4 ? '15px' : '17px', fontStyle: 'bold', color: '#cfe0ff' }).setOrigin(0, 0.5);
      wStrip.add([gauge, icon, ring, name, num]);
      card.setInteractive({ useHandCursor: true });
      card.on('pointerup', () => {
        if (!this.dragged) onWeapon(i);
      });
      this.weaponBtns.push({ index: i, cx, cy: wy, color: w.color, bg, gauge, ring, icon, wasReady: false });
    });
    if (features.weapon) this.scroller(wStrip, wy, W_CARD_H, WEAPONS.length * (W_CARD_W + CARD_GAP) - CARD_GAP, d);
    this.objs = scene.children.list.filter((o) => !before.has(o));
  }

  /** HUD 통째로 지우기(전투 중 상점에서 산 것을 바로 반영할 때 다시 만듦) */
  destroy(): void {
    for (const off of this.offs) off();
    this.offs = [];
    this.scene.tweens.killTweensOf(this.objs);
    for (const o of this.objs) o.destroy();
    this.objs = [];
  }

  /** ↔ 가로 스크롤 줄(끌기·마우스 휠) — 화면보다 넓을 때만 움직이고 ▶ 표시 */
  private scroller(strip: Phaser.GameObjects.Container, cy: number, h: number, contentW: number, depth: number): void {
    const scene = this.scene;
    const minX = Math.min(0, 1280 - (contentW + ROW_X0 * 2));
    let downX: number | null = null;
    let startX = 0;
    const inStrip = (p: Phaser.Input.Pointer): boolean => Math.abs(p.y - cy) <= h / 2;
    const down = (p: Phaser.Input.Pointer): void => {
      this.dragged = false;
      downX = inStrip(p) ? p.x : null;
      startX = strip.x;
    };
    const move = (p: Phaser.Input.Pointer): void => {
      if (downX === null || !p.isDown) return;
      const dx = p.x - downX;
      if (Math.abs(dx) > DRAG_START) this.dragged = true; // 손가락이 조금 흔들린 건 탭으로
      if (this.dragged) strip.x = Phaser.Math.Clamp(startX + dx, minX, 0);
    };
    const up = (): void => {
      downX = null;
    };
    const wheel = (p: Phaser.Input.Pointer, _o: unknown, dx: number, dy: number): void => {
      if (inStrip(p)) strip.x = Phaser.Math.Clamp(strip.x - (dx || dy), minX, 0);
    };
    scene.input.on('pointerdown', down);
    scene.input.on('pointermove', move);
    scene.input.on('pointerup', up);
    scene.input.on('wheel', wheel);
    this.offs.push(() => {
      scene.input.off('pointerdown', down);
      scene.input.off('pointermove', move);
      scene.input.off('pointerup', up);
      scene.input.off('wheel', wheel);
    });
    if (minX < 0) {
      const hint = scene.add.text(1272, cy, '▶', { fontSize: '22px', color: '#ffffff' }).setOrigin(1, 0.5).setDepth(depth + 5).setAlpha(0.7);
      scene.tweens.add({ targets: hint, x: 1262, duration: 500, yoyo: true, repeat: -1 });
      const show = (): void => {
        hint.setVisible(strip.x > minX + 4);
      };
      scene.events.on(Phaser.Scenes.Events.UPDATE, show);
      this.offs.push(() => scene.events.off(Phaser.Scenes.Events.UPDATE, show));
    }
  }

  /** 👑 영웅 스킬 버튼 + 💧 마나 바 — 전장 오른쪽 위(하단 HUD와 겹치지 않게) */
  private buildHeroPanel(onHeroSkill: (index: number) => void, owned: boolean[], d: number, skillsOn = true): void {
    const s = this.scene;
    const x = HERO_PANEL_X;
    // 👑 영웅 체력(쓰러지면 패배) — 마나 바 왼쪽
    s.add.rectangle(x - 85, 60, 136, 24, 0x000000, 0.55).setDepth(d);
    this.heroHpFill = s.add.rectangle(x - 149, 60, 128, 16, 0x5cff9e).setOrigin(0, 0.5).setDepth(d + 1);
    this.heroHpText = s.add.text(x - 85, 60, '', { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(d + 2);
    if (!skillsOn) return; // 🎓 2관문부터 영웅 스킬·마나
    s.add.rectangle(x + 60, 60, 136, 24, 0x000000, 0.55).setDepth(d);
    this.manaFill = s.add.rectangle(x - 4, 60, 128, 16, 0x4a9eff).setOrigin(0, 0.5).setDepth(d + 1);
    this.manaText = s.add.text(x + 60, 60, '', { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(d + 2);
    HERO_SKILLS.forEach((sk, i) => {
      const cy = HERO_BTN_Y;
      const bx = x - i * (HERO_BTN_R * 2 + 14); // 스킬이 늘면 왼쪽으로
      const bg = s.add.circle(bx, cy, HERO_BTN_R, 0x1a2133, 0.92).setStrokeStyle(4, 0xffd34d).setDepth(d);
      s.add.text(bx, cy - 4, sk.icon, { fontSize: '32px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5).setDepth(d + 2);
      const cost = s.add.text(bx, cy + 27, `💧${sk.mana}`, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#d8f0ff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5).setDepth(d + 2);
      // ✨ 쓸 수 있을 때 바깥에서 반짝이는 금빛 고리
      const glow = s.add.circle(bx, cy, HERO_BTN_R + 6).setStrokeStyle(4, 0xffe14d, 1).setDepth(d - 1).setVisible(false);
      s.tweens.add({ targets: glow, scale: 1.15, alpha: 0.25, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      s.add
        .text(bx - HERO_BTN_R + 2, cy - HERO_BTN_R + 2, sk.hotkey, { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#3a2a10', backgroundColor: '#ffd34d', padding: { x: 4, y: 0 } })
        .setDepth(d + 3);
      const shade = s.add.graphics().setDepth(d + 1);
      if (!owned[i]) s.add.text(bx, cy - 4, '🔒', { fontSize: '26px', padding: { top: 12, bottom: 4 } }).setOrigin(0.5).setDepth(d + 4).setAlpha(0.85); // 강화에서 해금
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        s.tweens.add({ targets: bg, scale: 0.88, duration: 70, yoyo: true }); // 눌림
        onHeroSkill(i);
      });
      this.heroBtns.push({ bg, shade, cx: bx, cy, glow, cost, owned: !!owned[i] });
    });
  }

  /** 👑 마나·스킬 대기 표시 */
  updateHero(mana: number, manaMax: number, skills: { cd: number; enough: boolean }[], heroHp = 1): void {
    const r = Phaser.Math.Clamp(heroHp, 0, 1);
    const danger = r < 0.3;
    this.heroHpFill.setSize(128 * r, 16).setFillStyle(danger ? 0xff4a4a : r < 0.6 ? 0xffc04a : 0x5cff9e);
    this.heroHpFill.setAlpha(danger && Math.floor(this.scene.time.now / 250) % 2 === 0 ? 0.4 : 1); // 위험하면 깜빡
    this.heroHpText.setText(`👑 ${Math.round(r * 100)}%`);
    this.manaFill?.setSize(128 * Phaser.Math.Clamp(mana / manaMax, 0, 1), 16);
    this.manaText?.setText(`💧 ${Math.floor(mana)} / ${manaMax}`);
    this.heroBtns.forEach((b, i) => {
      const st = skills[i];
      b.shade.clear();
      if (!st) return;
      if (st.cd > 0) {
        b.shade.fillStyle(0x000000, 0.6);
        b.shade.slice(b.cx, b.cy, HERO_BTN_R - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * st.cd, false);
        b.shade.fillPath();
      }
      // 쓸 수 있음 = 금빛 테두리 + 반짝이는 고리 / 못 씀 = 회색 테두리, 마나가 모자라면 비용이 빨강
      const ready = b.owned && st.enough && st.cd <= 0;
      b.bg.setAlpha(ready ? 1 : 0.55).setFillStyle(ready ? 0x2a3f6a : 0x1a2133, 0.92).setStrokeStyle(4, ready ? 0xffd34d : 0x5a6274);
      b.glow.setVisible(ready);
      b.cost.setColor(b.owned && !st.enough ? '#ff8a8a' : '#d8f0ff');
    });
  }

  /** 🎓 👆 안내용 위치 — 유닛 카드 / 특수 무기 카드 / 영웅 스킬 / 리듬 바 */
  unitCardPos(key: string): { x: number; y: number } | null {
    const s = this.slots.find((x) => x.key === key) ?? this.slots[0];
    return s ? { x: s.cx + this.strip.x, y: CARD_CY } : null;
  }

  weaponPos(index: number): { x: number; y: number } | null {
    const b = this.weaponBtns.find((w) => w.index === index);
    return b ? { x: b.cx + (b.bg.parentContainer?.x ?? 0), y: b.cy } : null;
  }

  heroSkillPos(index: number): { x: number; y: number } | null {
    const b = this.heroBtns[index];
    return b ? { x: b.cx, y: b.cy } : null;
  }

  beatPos(): { x: number; y: number } {
    return { x: this.beatX + this.beatW / 2, y: 432 };
  }

  /** 마나 부족 등 안내(영웅 스킬 버튼 옆) */
  heroDeny(msg: string): void {
    const t = this.scene.add.text(HERO_PANEL_X - 60, HERO_BTN_Y, msg, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ff9a9a' }).setOrigin(1, 0.5).setDepth(130);
    this.scene.tweens.add({ targets: t, x: t.x - 20, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  /** 🤝 발동 중인 조합 배지(왼쪽 위) */
  setSynergies(list: Synergy[]): void {
    this.synergyText.setVisible(list.length > 0).setText(list.map((s) => `${s.icon} ${s.name}`).join('   '));
  }

  /** 소환 실패 피드백 — 카드 흔들림 + 사유 표시 */
  /** 🔥 특수 무기를 못 쓸 때 안내(카드 흔들림 + 이유) */
  weaponDeny(index: number, msg: string): void {
    const b = this.weaponBtns.find((w) => w.index === index);
    const strip = b?.bg.parentContainer;
    const x = (b?.cx ?? 640) + (strip?.x ?? 0) + 40;
    if (b) this.scene.tweens.add({ targets: b.bg, x: b.cx + 5, duration: 50, yoyo: true, repeat: 2 });
    const t = this.scene.add
      .text(x, W_CARD_CY - 62, msg, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffd34d', stroke: '#000000', strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(130);
    this.scene.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 800, onComplete: () => t.destroy() });
  }

  deny(key: string, reason: 'energy' | 'food' | 'cooldown'): void {
    const slot = this.slots.find((s) => s.key === key);
    if (!slot) return;
    this.scene.tweens.add({ targets: slot.rect, x: slot.cx + 6, duration: 50, yoyo: true, repeat: 2 });
    const msg = reason === 'energy' ? '⚡ 부족!' : reason === 'food' ? '🍖 꽉 참!' : '⏱️ 대기 중!';
    const t = this.scene.add.text(slot.cx + this.strip.x, 440, msg, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ff7a7a' }).setOrigin(0.5).setDepth(130);
    this.scene.tweens.add({ targets: t, y: 395, alpha: 0, duration: 650, onComplete: () => t.destroy() });
  }

  update(s: HudState): void {
    this.lvText.setText(`LV ${s.lv}`);
    this.goldText.setText(`🪙 ${s.gold}`);
    const pos = Phaser.Math.Clamp(s.linePos, 0, 1);
    this.vsBlue.setSize(this.vsW * pos, 16);
    this.vsRed.setSize(this.vsW * (1 - pos), 16);
    this.vsMark.setX(this.vsX + this.vsW * pos);
    this.energyFill.setSize(396 * Phaser.Math.Clamp(s.energy / s.energyMax, 0, 1), 18);
    this.energyText.setText(`${Math.floor(s.energy)} / ${s.energyMax}`);
    this.foodFill.setSize(396 * Phaser.Math.Clamp(s.food / s.foodMax, 0, 1), 18);
    this.foodText.setText(`${s.food} / ${s.foodMax}`);
    this.beatMark?.setX(this.beatX + this.beatW * Phaser.Math.Clamp(s.beat, 0, 1));
    // 특수 무기 게이지(위에서 시계 방향으로 채움) + 발사 가능 깜빡임
    this.weaponBtns.forEach((b) => {
      const st = s.weapons[b.index];
      if (!st) return;
      b.gauge.clear();
      if (st.ratio > 0) {
        b.gauge.fillStyle(b.color, st.ready ? 0.55 : 0.35);
        b.gauge.slice(b.cx, b.cy, WEAPON_R - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * st.ratio, false);
        b.gauge.fillPath();
      }
      b.icon.setAlpha(st.ready ? 1 : 0.55);
      if (st.ready !== b.wasReady) {
        b.wasReady = st.ready;
        b.bg.setStrokeStyle(3, st.ready ? b.color : 0x3a4560);
        b.ring.setVisible(st.ready).setScale(1).setAlpha(1);
        this.scene.tweens.killTweensOf(b.ring);
        if (st.ready) this.scene.tweens.add({ targets: b.ring, scale: 1.18, alpha: 0.2, duration: 650, repeat: -1 });
      }
    });
    // 소환 가능/불가 밝기 + 전장 강화 버튼
    for (const slot of this.slots) {
      const ok = s.afford[slot.key] ?? true;
      const a = ok ? 1 : 0.4;
      slot.rect.setAlpha(a);
      slot.icon.setAlpha(a);
      slot.face?.setAlpha(a);
      slot.label.setAlpha(ok ? 1 : 0.85); // 이름은 소환 못 할 때도 잘 보이게
      slot.cost.setAlpha(ok ? 1 : 0.6);
      slot.cost.setColor(ok ? '#aef5b0' : '#ff9a9a');
      slot.cdShade.setSize(CARD_W, CARD_H * Math.min(1, s.cd[slot.key] ?? 0)); // ⏱️ 대기 중이면 어둡게 덮고 아래로 줄어듦
      const good = !!s.good?.[slot.key];
      if (slot.goodTag && slot.goodTag.visible !== good) {
        slot.goodTag.setVisible(good);
        slot.rect.setStrokeStyle(3, good ? 0xffe14d : slot.col);
      }
      if (good && slot.goodTag) slot.goodTag.setScale(1 + 0.08 * Math.sin(this.scene.time.now / 120));
      const up = s.upg[slot.key];
      if (up) {
        slot.lvText.setText(`Lv${up.lv}`);
        slot.upText.setText(`⬆${up.cost}`);
        slot.upBtn.setAlpha(up.afford ? 1 : 0.4);
      }
    }
  }
}
