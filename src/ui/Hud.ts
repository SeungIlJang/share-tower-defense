import Phaser from 'phaser';
import type { UnitStats } from '../types';

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
}

const UNIT_COLORS: Record<string, number> = {
  soldier: 0x4a9eff,
  archer: 0x5cff9e,
  knight: 0xb98cff,
  spear: 0x4ad0e0,
  mage: 0xd58cff,
};

interface Slot {
  key: string;
  cx: number;
  cy: number;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  cost: Phaser.GameObjects.Text;
  icon: Phaser.GameObjects.Rectangle;
  upBtn: Phaser.GameObjects.Rectangle;
  upText: Phaser.GameObjects.Text;
  lvText: Phaser.GameObjects.Text;
}

// 세로(720×1280) 레이아웃 앵커
const W = 720;

/** 전투 HUD(세로) — 상단(LV·VS·골드) + 리듬바 + 자원바 + 2행 유닛카드 + 소환 가이드 */
export class Hud {
  private scene: Phaser.Scene;
  private lvText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private vsBlue: Phaser.GameObjects.Rectangle;
  private vsRed: Phaser.GameObjects.Rectangle;
  private vsMark: Phaser.GameObjects.Triangle;
  private readonly vsX = 200;
  private readonly vsW = 320;

  private energyFill: Phaser.GameObjects.Rectangle;
  private energyText: Phaser.GameObjects.Text;
  private foodFill: Phaser.GameObjects.Rectangle;
  private foodText: Phaser.GameObjects.Text;

  private slots: Slot[] = [];
  private hint: Phaser.GameObjects.Container | null = null;
  private beatMark: Phaser.GameObjects.Triangle;
  private readonly beatX = 140;
  private readonly beatW = 440;

  constructor(
    scene: Phaser.Scene,
    units: Record<string, UnitStats>,
    onSpawn: (type: string) => void,
    onUpgrade: (type: string) => void
  ) {
    this.scene = scene;
    const d = 100;
    // 상단 바
    scene.add.rectangle(W / 2, 26, W, 52, 0x0d1424, 0.85).setDepth(d);
    this.lvText = scene.add.text(14, 26, 'LV 1', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(0, 0.5).setDepth(d + 1);
    this.goldText = scene.add.text(W - 14, 26, '🪙 0', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffd34d' }).setOrigin(1, 0.5).setDepth(d + 1);
    // VS 전선 바(둘째 줄)
    const vsY = 62;
    scene.add.rectangle(this.vsX + this.vsW / 2, vsY, this.vsW + 4, 18, 0x000000, 0.5).setDepth(d);
    this.vsBlue = scene.add.rectangle(this.vsX, vsY, this.vsW / 2, 14, 0x3aa0ff).setOrigin(0, 0.5).setDepth(d + 1);
    this.vsRed = scene.add.rectangle(this.vsX + this.vsW, vsY, this.vsW / 2, 14, 0xff4a4a).setOrigin(1, 0.5).setDepth(d + 1);
    scene.add.text(this.vsX + this.vsW / 2, vsY, 'VS', { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    this.vsMark = scene.add.triangle(this.vsX + this.vsW / 2, vsY + 13, 0, 8, 10, 8, 5, 0, 0xffffff).setDepth(d + 2);

    // ⏱️ 리듬 소환 바 (초록 중앙 = PERFECT)
    const beatY = 902;
    scene.add.text(W / 2, beatY - 24, '⏱️ 초록에 맞춰 소환 = PERFECT 강화!', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffe14d' }).setOrigin(0.5).setDepth(d + 1);
    scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW + 4, 16, 0x000000, 0.5).setDepth(d);
    scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW, 12, 0x2a3348).setDepth(d + 1);
    scene.add.rectangle(this.beatX + this.beatW / 2, beatY, this.beatW * 0.16, 12, 0x3fd06a).setDepth(d + 1); // 퍼펙트 존
    this.beatMark = scene.add.triangle(this.beatX + this.beatW / 2, beatY, 0, -10, 10, -10, 5, 2, 0xffffff).setDepth(d + 2);

    // 자원 바 (식량 | 에너지) — 좌우 나란히
    const by = 948;
    const bw = 330;
    // 식량(인구)
    scene.add.rectangle(20 + bw / 2, by, bw, 24, 0x000000, 0.5).setDepth(d);
    this.foodFill = scene.add.rectangle(22, by, bw - 4, 18, 0xe0a24e).setOrigin(0, 0.5).setDepth(d + 1);
    this.foodText = scene.add.text(20 + bw / 2, by, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(26, by - 22, '🍖 인구', { fontFamily: 'sans-serif', fontSize: '12px', color: '#fff' }).setOrigin(0, 0.5).setDepth(d + 2);
    // 에너지(소환)
    const ex = W - 20 - bw;
    scene.add.rectangle(ex + bw / 2, by, bw, 24, 0x000000, 0.5).setDepth(d);
    this.energyFill = scene.add.rectangle(ex + 2, by, bw - 4, 18, 0x4ac8e0).setOrigin(0, 0.5).setDepth(d + 1);
    this.energyText = scene.add.text(ex + bw / 2, by, '', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 2);
    scene.add.text(W - 26, by - 22, '⚡ 소환', { fontFamily: 'sans-serif', fontSize: '12px', color: '#fff' }).setOrigin(1, 0.5).setDepth(d + 2);

    // 유닛 카드 2행 × 5
    const keys = Object.keys(units);
    const slotW = 132;
    const gap = 8;
    const perRow = 5;
    const rowW = perRow * slotW + (perRow - 1) * gap;
    const startX = (W - rowW) / 2 + slotW / 2;
    const rowY = [1050, 1166];
    const slotH = 98;
    for (let i = 0; i < 10; i++) {
      const cx = startX + (i % perRow) * (slotW + gap);
      const cy = rowY[Math.floor(i / perRow)];
      const key = keys[i];
      if (key) {
        const u = units[key];
        const col = UNIT_COLORS[key] ?? 0x4a9eff;
        const rect = scene.add.rectangle(cx, cy, slotW, slotH, 0x2a3348).setStrokeStyle(3, col).setDepth(d);
        const icon = scene.add.rectangle(cx - 40, cy - 10, 38, 38, col).setDepth(d + 1);
        const label = scene.add.text(cx - 14, cy - 20, u.name, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#fff' }).setOrigin(0, 0.5).setDepth(d + 1);
        const cost = scene.add.text(cx - 40, cy + 20, `⚡${u.cost} 🍖${u.pop}`, { fontFamily: 'sans-serif', fontSize: '14px', color: '#cfe' }).setOrigin(0, 0.5).setDepth(d + 1);
        scene.add.text(cx - 58, cy + 30, String(i + 1), { fontFamily: 'sans-serif', fontSize: '12px', color: '#8aa' }).setDepth(d + 1);
        rect.setInteractive({ useHandCursor: true });
        rect.on('pointerdown', () => onSpawn(key));
        // 🛠️ 전장 실시간 강화 버튼(카드 우상단)
        const upBtn = scene.add.rectangle(cx + 44, cy - 26, 42, 26, 0x2f7a4d).setStrokeStyle(1, 0x5cff9e).setDepth(d + 2).setInteractive({ useHandCursor: true });
        const upText = scene.add.text(cx + 44, cy - 26, '⬆', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5).setDepth(d + 3);
        const lvText = scene.add.text(cx - 58, cy - 30, 'Lv1', { fontFamily: 'sans-serif', fontSize: '12px', fontStyle: 'bold', color: '#ffd34d' }).setDepth(d + 2);
        upBtn.on('pointerdown', () => onUpgrade(key));
        this.slots.push({ key, cx, cy, rect, label, cost, icon, upBtn, upText, lvText });
      } else {
        scene.add.rectangle(cx, cy, slotW, slotH, 0x20242e).setStrokeStyle(3, 0x3a3f4a).setDepth(d);
        scene.add.text(cx, cy, '🔒', { fontSize: '30px' }).setOrigin(0.5).setDepth(d + 1);
      }
    }

    // 소환 가이드 (첫 유닛 칸 위 화살표 + 문구)
    if (this.slots.length) {
      const s0 = this.slots[0];
      const c = scene.add.container(0, 0).setDepth(d + 5);
      const txt = scene.add.text(s0.cx + 30, s0.cy - 78, '👆 눌러서 소환!', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffe14d', backgroundColor: '#000000aa', padding: { x: 10, y: 4 } }).setOrigin(0.5);
      const arrow = scene.add.triangle(s0.cx, s0.cy - 56, 0, 0, 20, 0, 10, 16, 0xffe14d);
      c.add([txt, arrow]);
      scene.tweens.add({ targets: c, y: 10, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.hint = c;
    }
  }

  hideHint(): void {
    if (this.hint) {
      this.hint.destroy(true);
      this.hint = null;
    }
  }

  /** 소환 실패 피드백 — 카드 흔들림 + 사유 표시 */
  deny(key: string, reason: 'energy' | 'food'): void {
    const slot = this.slots.find((s) => s.key === key);
    if (!slot) return;
    this.scene.tweens.add({ targets: slot.rect, x: slot.cx + 6, duration: 50, yoyo: true, repeat: 2 });
    const msg = reason === 'energy' ? '⚡ 부족!' : '🍖 꽉 참!';
    const t = this.scene.add.text(slot.cx, slot.cy - 56, msg, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ff7a7a' }).setOrigin(0.5).setDepth(130);
    this.scene.tweens.add({ targets: t, y: slot.cy - 86, alpha: 0, duration: 650, onComplete: () => t.destroy() });
  }

  update(s: HudState): void {
    this.lvText.setText(`LV ${s.lv}`);
    this.goldText.setText(`🪙 ${s.gold}`);
    const pos = Phaser.Math.Clamp(s.linePos, 0, 1);
    this.vsBlue.setSize(this.vsW * pos, 14);
    this.vsRed.setSize(this.vsW * (1 - pos), 14);
    this.vsMark.setX(this.vsX + this.vsW * pos);
    this.energyFill.setSize(326 * Phaser.Math.Clamp(s.energy / s.energyMax, 0, 1), 18);
    this.energyText.setText(`${Math.floor(s.energy)} / ${s.energyMax}`);
    this.foodFill.setSize(326 * Phaser.Math.Clamp(s.food / s.foodMax, 0, 1), 18);
    this.foodText.setText(`${s.food} / ${s.foodMax}`);
    this.beatMark.setX(this.beatX + this.beatW * Phaser.Math.Clamp(s.beat, 0, 1));
    for (const slot of this.slots) {
      const ok = s.afford[slot.key] ?? true;
      const a = ok ? 1 : 0.4;
      slot.rect.setAlpha(a);
      slot.icon.setAlpha(a);
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
