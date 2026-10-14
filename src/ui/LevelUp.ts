import Phaser from 'phaser';
import { SKILLS } from '../systems/skills';

/** 레벨업 → 스킬 택1 오버레이 (레퍼런스: LEVEL UP / PICK A SKILL) */
export class LevelUpOverlay {
  private layer?: Phaser.GameObjects.Container;
  constructor(private scene: Phaser.Scene) {}

  show(levels: Record<string, number>, onPick: (key: string) => void): void {
    this.hide();
    const s = this.scene;
    const c = s.add.container(0, 0).setDepth(300);
    c.add(s.add.rectangle(640, 360, 1280, 720, 0x000000, 0.72));
    // 배너
    c.add(s.add.rectangle(640, 96, 520, 70, 0xc9942a).setStrokeStyle(4, 0x8a5e12));
    c.add(
      s.add
        .text(640, 96, 'LEVEL UP', { fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#fff' })
        .setOrigin(0.5)
    );

    SKILLS.forEach((def, i) => {
      const lv = levels[def.key] ?? 0;
      const maxed = lv >= def.max;
      const cx = 640 + (i - (SKILLS.length - 1) / 2) * 280; // 카드 수에 맞춰 가운데 정렬
      const cy = 380;
      const card = s.add.rectangle(cx, cy, 240, 360, maxed ? 0x3a2a2a : 0x7a2230).setStrokeStyle(4, maxed ? 0x555 : 0xe0b84e);
      c.add(card);
      c.add(s.add.circle(cx, cy - 180, 22, 0xe0b84e).setStrokeStyle(3, 0xfff0b0));
      c.add(s.add.text(cx, cy - 180, String(i + 1), { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#3a2a10' }).setOrigin(0.5));
      c.add(s.add.text(cx, cy - 120, def.name, { fontFamily: 'sans-serif', fontSize: '26px', fontStyle: 'bold', color: '#ffd34d', align: 'center' }).setOrigin(0.5));
      c.add(s.add.text(cx, cy - 30, def.desc, { fontFamily: 'sans-serif', fontSize: '17px', color: '#fff', align: 'center', wordWrap: { width: 210 } }).setOrigin(0.5));
      c.add(s.add.text(cx, cy + 140, Number.isFinite(def.max) ? `LV  ${lv} / ${def.max}` : `LV  ${lv}`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: maxed ? '#888' : '#7cf6ff' }).setOrigin(0.5));
      if (!maxed) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => {
          onPick(def.key);
          this.hide();
        });
      } else {
        c.add(s.add.text(cx, cy + 170, 'MAX', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ff7a7a' }).setOrigin(0.5));
      }
    });

    c.add(
      s.add
        .text(640, 616, 'PICK A SKILL', { fontFamily: 'sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#ff9a3c' })
        .setOrigin(0.5)
    );
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
