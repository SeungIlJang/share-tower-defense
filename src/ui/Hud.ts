import Phaser from 'phaser';
import type { UnitStats } from '../types';
import { iconKey, textureKey } from '../systems/sprites';
import { WEAPONS } from '../systems/weapons';
import type { Synergy } from '../systems/synergy';

export interface HudState {
  lv: number;
  gold: number;
  energy: number;
  energyMax: number;
  food: number;
  foodMax: number;
  linePos: number; // 0(우리 기지) ~ 1(적 기지)
  afford: Record<string, boolean>; // 유닛별 지금 소환 가능 여부
  beat: number; // ⏱️ 리듬 소환 마커 위치 0~1
  perfectWin: number; // 퍼펙트 허용 폭(중앙 ±)
  upg: Record<string, { lv: number; cost: number; afford: boolean }>; // 전장 실시간 강화
  weapons: ({ ratio: number; ready: boolean } | null)[]; // 특수 무기 게이지(구매 안 한 것 = null)
}

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

const WEAPON_R = 30;
const UNIT_SLOTS = 12; // 유닛 칸 수(유닛 데이터보다 많으면 나머지는 잠금 '준비 중')
const ROW_X0 = 4; // 하단 두 줄 모두 화면 폭을 꽉 채움
const ROW_W = 1280 - ROW_X0 * 2;

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
  private weaponBtns: WeaponButton[] = [];
  private synergyText!: Phaser.GameObjects.Text;
  private beatMark: Phaser.GameObjects.Triangle;
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
    looks: Record<string, string> = {} // 👗 스킨 적용 얼굴(유닛@스킨)
  ) {
    this.scene = scene;
    const d = 100;
    scene.add.rectangle(640, 22, 1280, 44, 0x0d1424, 0.8).setDepth(d);
    this.synergyText = scene.add
      .text(12, 52, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#aef5ff', backgroundColor: '#0d1424cc', padding: { x: 8, y: 4 } })
      .setDepth(d + 1)
      .setVisible(false);
    this.lvText = scene.add.text(18, 22, 'LV 1', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0, 0.5).setDepth(d + 1);
    scene.add.rectangle(this.vsX + this.vsW / 2, 22, this.vsW + 4, 20, 0x000000, 0.5).setDepth(d);
    this.vsBlue = scene.add.rectangle(this.vsX, 22, this.vsW / 2, 16, 0x3aa0ff).setOrigin(0, 0.5).setDepth(d + 1);
    this.vsRed = scene.add.rectangle(this.vsX + this.vsW, 22, this.vsW / 2, 16, 0xff4a4a).setOrigin(1, 0.5).setDepth(d + 1);
    scene.add.text(this.vsX + this.vsW / 2, 22, 'VS', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    this.vsMark = scene.add.triangle(this.vsX + this.vsW / 2, 36, 0, 8, 10, 8, 5, 0, 0xffffff).setDepth(d + 2);
    this.goldText = scene.add.text(1262, 22, '🪙 0', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(1, 0.5).setDepth(d + 1);

    // 하단 HUD 판(전장과 구분)
    scene.add.rectangle(640, 605, 1280, 230, 0x0b0f1a, 0.92).setDepth(d - 1);
    scene.add.rectangle(640, 490, 1280, 2, 0x3a4560).setDepth(d - 1);
    const by = 510;
    scene.add.rectangle(240, by, 400, 22, 0x000000, 0.5).setDepth(d);
    this.foodFill = scene.add.rectangle(42, by, 396, 18, 0xe0a24e).setOrigin(0, 0.5).setDepth(d + 1);
    this.foodText = scene.add.text(240, by, '', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(22, by, '🍖 인구', { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff' }).setOrigin(0, 0.5).setDepth(d + 2);
    scene.add.rectangle(1040, by, 400, 22, 0x000000, 0.5).setDepth(d);
    this.energyFill = scene.add.rectangle(842, by, 396, 18, 0x4ac8e0).setOrigin(0, 0.5).setDepth(d + 1);
    this.energyText = scene.add.text(1040, by, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(1238, by, '⚡ 소환', { fontFamily: 'sans-serif', fontSize: '13px', color: '#fff' }).setOrigin(1, 0.5).setDepth(d + 2);

    // ⏱️ 리듬 소환 바 (초록 중앙 = PERFECT) — 하단 HUD, 인구/에너지 바 사이
    const beatY = by + 4;
    scene.add.text(this.beatX + this.beatW / 2, by - 15, '⏱️ 초록에 맞춰 소환 = PERFECT 강화!', { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffe14d' }).setOrigin(0.5).setDepth(d + 1);
    scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW + 4, 16, 0x000000, 0.5).setDepth(d);
    scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW, 12, 0x2a3348).setDepth(d + 1);
    scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW * 0.16, 12, 0x3fd06a).setDepth(d + 1); // 퍼펙트 존
    this.beatMark = scene.add.triangle(this.beatX + this.beatW / 2, beatY, 0, -10, 10, -10, 5, 2, 0xffffff).setDepth(d + 2);

    // 하단 1단: 유닛 12칸(화면 폭 꽉) — 유닛 데이터 수만큼 쓰고 나머지는 잠금
    const keys = Object.keys(units);
    const gap = 6;
    const slotW = (ROW_W - gap * (UNIT_SLOTS - 1)) / UNIT_SLOTS; // ≈100px
    const cy = 580;
    const slotH = 100;
    for (let i = 0; i < UNIT_SLOTS; i++) {
      const cx = ROW_X0 + slotW / 2 + i * (slotW + gap);
      const key = keys[i];
      if (!key || !unitOwned[key]) {
        // 데이터 없음 = '준비 중' / 구매 안 함 = 얼굴 흐리게 + '강화에서 구매'
        scene.add.rectangle(cx, cy, slotW, slotH, 0x20242e).setStrokeStyle(2, 0x3a3f4a).setDepth(d);
        if (key && scene.textures.exists(iconKey(key))) {
          scene.add.image(cx, cy - 6, iconKey(key)).setDisplaySize(56, 56).setDepth(d + 1).setAlpha(0.25);
        }
        scene.add.text(cx, cy - 6, '🔒', { fontSize: '24px' }).setOrigin(0.5).setDepth(d + 2).setAlpha(0.75);
        const msg = key ? '🛒 강화에서 구매' : '준비 중';
        scene.add.text(cx, cy + 36, msg, { fontFamily: 'sans-serif', fontSize: '12px', color: key ? '#a8b4c8' : '#6a7488' }).setOrigin(0.5).setDepth(d + 2);
        continue;
      }
      const u = units[key];
      const col = UNIT_COLORS[key] ?? 0x4a9eff;
      const rect = scene.add.rectangle(cx, cy, slotW, slotH, 0x2a3348).setStrokeStyle(3, col).setDepth(d);
      // 윗줄: 레벨(좌) · 전장 강화 버튼(우) / 아랫부분: 얼굴 + 이름 + 비용
      const lvText = scene.add.text(cx - 46, cy - 35, 'Lv1', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0, 0.5).setDepth(d + 2);
      const icon = scene.add.rectangle(cx - 20, cy + 1, 46, 46, col).setDepth(d + 1);
      const faceKey = scene.textures.exists(iconKey(looks[key] ?? key)) ? iconKey(looks[key] ?? key) : iconKey(key);
      const face = scene.textures.exists(faceKey)
        ? scene.add.image(cx - 20, cy + 1, faceKey).setDisplaySize(46, 46).setDepth(d + 2)
        : null;
      if (face) icon.setFillStyle(0x1a2133).setStrokeStyle(2, col); // 얼굴 뒤는 어두운 바탕 + 유닛 색 테두리
      const label = scene.add.text(cx, cy + 36, u.name, { fontFamily: 'sans-serif', fontSize: u.name.length >= 5 ? '13px' : '15px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 1);
      const cost = scene.add.text(cx + 8, cy + 1, `⚡${u.cost}
🍖${u.pop}`, { fontFamily: 'sans-serif', fontSize: '12px', lineSpacing: 1, color: '#cfe' }).setOrigin(0, 0.5).setDepth(d + 1);
      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerdown', () => onSpawn(key));
      // 🛠️ 전장 실시간 강화 버튼(카드 우상단) — 탭 영역이 카드보다 위라 소환과 분리됨
      const upBtn = scene.add.rectangle(cx + 24, cy - 35, 48, 24, 0x2f7a4d).setStrokeStyle(1, 0x5cff9e).setDepth(d + 2).setInteractive({ useHandCursor: true });
      const upText = scene.add.text(cx + 24, cy - 35, '⬆', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 3);
      upBtn.on('pointerdown', () => onUpgrade(key));
      this.slots.push({ key, cx, rect, label, cost, icon, face, upBtn, upText, lvText });
    }

    // 하단 2단: 특수 무기 9버튼(게이지가 차면 발사, 단축키 1~9). 유닛 줄과 같은 폭으로, 스테이지에 따라 앞에서부터 해금
    const wStep = (ROW_W - WEAPON_R * 2) / (WEAPONS.length - 1);
    WEAPONS.forEach((w, i) => {
      const cx = ROW_X0 + WEAPON_R + i * wStep;
      const wy = 666;
      const bg = scene.add.circle(cx, wy, WEAPON_R, 0x1a2133).setStrokeStyle(3, 0x3a4560).setDepth(d);
      scene.add
        .text(cx - WEAPON_R + 2, wy + WEAPON_R - 4, String(i + 1), { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#3a2a10', backgroundColor: '#ffd34d', padding: { x: 3, y: 0 } })
        .setOrigin(0, 1)
        .setDepth(d + 4);
      if (!weaponOwned[i]) {
        scene.add.text(cx, wy, '🔒', { fontSize: '20px' }).setOrigin(0.5).setDepth(d + 2).setAlpha(0.6);
        scene.add.text(cx, wy + WEAPON_R + 10, '🛒 구매', { fontFamily: 'sans-serif', fontSize: '12px', color: '#7c8aa0' }).setOrigin(0.5).setDepth(d + 2);
        return;
      }
      const gauge = scene.add.graphics().setDepth(d + 1);
      const ring = scene.add.circle(cx, wy, WEAPON_R + 3).setStrokeStyle(3, w.color).setDepth(d + 3).setVisible(false);
      const iconTex = textureKey('weapon_icons'); // public/sprites 무기 아이콘 시트(프레임 i = i번째 무기)
      const icon = scene.textures.exists(iconTex)
        ? scene.add.image(cx, wy, iconTex, i).setDisplaySize(WEAPON_R * 1.45, WEAPON_R * 1.45).setDepth(d + 2)
        : scene.add.text(cx, wy, w.icon, { fontSize: '27px' }).setOrigin(0.5).setDepth(d + 2);
      scene.add.text(cx, wy + WEAPON_R + 10, w.name, { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#cfe0ff' }).setOrigin(0.5).setDepth(d + 2);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => onWeapon(i));
      this.weaponBtns.push({ index: i, cx, cy: wy, color: w.color, bg, gauge, ring, icon, wasReady: false });
    });
  }

  /** 🤝 발동 중인 조합 배지(왼쪽 위) */
  setSynergies(list: Synergy[]): void {
    this.synergyText.setVisible(list.length > 0).setText(list.map((s) => `${s.icon} ${s.name}`).join('   '));
  }

  /** 소환 실패 피드백 — 카드 흔들림 + 사유 표시 */
  deny(key: string, reason: 'energy' | 'food'): void {
    const slot = this.slots.find((s) => s.key === key);
    if (!slot) return;
    this.scene.tweens.add({ targets: slot.rect, x: slot.cx + 6, duration: 50, yoyo: true, repeat: 2 });
    const msg = reason === 'energy' ? '⚡ 부족!' : '🍖 꽉 참!';
    const t = this.scene.add.text(slot.cx, 520, msg, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ff7a7a' }).setOrigin(0.5).setDepth(130);
    this.scene.tweens.add({ targets: t, y: 470, alpha: 0, duration: 650, onComplete: () => t.destroy() });
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
    this.beatMark.setX(this.beatX + this.beatW * Phaser.Math.Clamp(s.beat, 0, 1));
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
      slot.label.setAlpha(a);
      slot.cost.setAlpha(ok ? 1 : 0.6);
      slot.cost.setColor(ok ? '#aef5b0' : '#ff9a9a');
      const up = s.upg[slot.key];
      if (up) {
        slot.lvText.setText(`Lv${up.lv}`);
        slot.upText.setText(`⬆${up.cost}`);
        slot.upBtn.setAlpha(up.afford ? 1 : 0.4);
      }
    }
  }
}
