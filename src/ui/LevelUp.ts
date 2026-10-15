import Phaser from 'phaser';
import { GRADES, type SkillDef } from '../systems/skills';

/** 레벨업 → 무작위 3장 중 택1 오버레이 (등급 색 · 지금→다음 수치 · 각성 예고 · 다시 뽑기) */
export class LevelUpOverlay {
  private layer?: Phaser.GameObjects.Container;
  constructor(private scene: Phaser.Scene) {}

  show(levels: Record<string, number>, choices: SkillDef[], rerolls: number, onPick: (key: string) => void, onReroll: () => void): void {
    this.hide();
    const s = this.scene;
    const c = s.add.container(0, 0).setDepth(300);
    c.add(s.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72).setInteractive()); // 뒤 클릭 막기
    // 배너
    c.add(s.add.rectangle(640, 70, 520, 70, 0xc9942a).setStrokeStyle(4, 0x8a5e12));
    c.add(s.add.text(640, 70, 'LEVEL UP!', { fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#fff' }).setOrigin(0.5));

    const W = 320;
    const H = 430;
    choices.forEach((def, i) => {
      const lv = levels[def.key] ?? 0;
      const g = GRADES[def.grade];
      const cx = 640 + (i - (choices.length - 1) / 2) * (W + 40);
      const cy = 345;
      const card = s.add.rectangle(cx, cy, W, H, g.color).setStrokeStyle(def.grade === 'common' ? 4 : 6, g.edge);
      c.add(card);
      // 등급 띠 + 번호
      c.add(s.add.text(cx, cy - H / 2 + 22, `${def.grade === 'legend' ? '🌟 ' : ''}${g.label}`, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#ffffff', backgroundColor: `#${g.edge.toString(16).padStart(6, '0')}55`, padding: { x: 14, y: 3 } }).setOrigin(0.5));
      c.add(s.add.text(cx - W / 2 + 14, cy - H / 2 + 10, String(i + 1), { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#3a2a10', backgroundColor: '#ffd34d', padding: { x: 7, y: 1 } }));
      c.add(s.add.text(cx, cy - 115, def.icon, { fontSize: '60px' }).setOrigin(0.5));
      c.add(s.add.text(cx, cy - 48, def.name, { fontFamily: 'sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffe680' }).setOrigin(0.5));
      c.add(s.add.text(cx, cy + 8, def.desc, { fontFamily: 'sans-serif', fontSize: '19px', color: '#fff', align: 'center', lineSpacing: 5 }).setOrigin(0.5));
      // 수치: 지금 → 다음 / 즉시 효과
      c.add(s.add.rectangle(cx, cy + 92, W - 30, 70, 0x000000, 0.3));
      if (def.value) {
        c.add(s.add.text(cx, cy + 74, `지금: ${def.value(lv)}`, { fontFamily: 'sans-serif', fontSize: '16px', color: '#c8d0e0' }).setOrigin(0.5));
        c.add(s.add.text(cx, cy + 106, `▶ ${def.value(lv + 1)}`, { fontFamily: 'sans-serif', fontSize: '21px', fontStyle: 'bold', color: '#7cff9a' }).setOrigin(0.5));
      } else {
        c.add(s.add.text(cx, cy + 92, '⚡ 고르면 바로 효과!', { fontFamily: 'sans-serif', fontSize: '21px', fontStyle: 'bold', color: '#7cff9a' }).setOrigin(0.5));
      }
      // 레벨 · 각성 예고
      const lvLabel = def.instant ? '' : Number.isFinite(def.max) ? `LV ${lv} → ${lv + 1} / ${def.max}` : `LV ${lv} → ${lv + 1}`;
      if (lvLabel) c.add(s.add.text(cx, cy + 148, lvLabel, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#7cf6ff' }).setOrigin(0.5));
      if (def.awaken) {
        const now = lv + 1 >= def.max;
        const t = s.add
          .text(cx, cy + 182, now ? `✨ 각성! ${def.awaken.name}: ${def.awaken.desc}` : `MAX 때 각성: ${def.awaken.name}`, {
            fontFamily: 'sans-serif',
            fontSize: now ? '15px' : '14px',
            fontStyle: 'bold',
            color: now ? '#ffe14d' : '#c8b8ff',
            align: 'center',
            wordWrap: { width: W - 24 },
          })
          .setOrigin(0.5);
        c.add(t);
        if (now) s.tweens.add({ targets: t, alpha: 0.4, duration: 450, yoyo: true, repeat: -1 });
      }
      if (def.grade === 'legend') s.tweens.add({ targets: card, scale: 1.03, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => {
        this.hide();
        onPick(def.key);
      });
    });

    // 🎲 다시 뽑기(한 판에 1회)
    const rb = s.add
      .text(640, 640, rerolls > 0 ? `🎲 다시 뽑기 (${rerolls}회 남음)` : '🎲 다시 뽑기 (다 썼어요)', {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: rerolls > 0 ? '#3a7bff' : '#4a5060',
        padding: { x: 22, y: 10 },
      })
      .setOrigin(0.5);
    c.add(rb);
    if (rerolls > 0) {
      rb.setInteractive({ useHandCursor: true });
      rb.on('pointerdown', () => onReroll());
    }
    c.add(s.add.text(640, 690, '👆 하나를 골라 주세요!', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ff9a3c' }).setOrigin(0.5));
    this.layer = c;
  }

  hide(): void {
    this.layer?.destroy(true);
    this.layer = undefined;
  }

  get open(): boolean {
    return !!this.layer;
  }
}
