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
    c.add(s.add.rectangle(360, 640, 720, 1280, 0x000000, 0.72));
    // 배너
    c.add(s.add.rectangle(360, 300, 520, 72, 0xc9942a).setStrokeStyle(4, 0x8a5e12));
    c.add(
      s.add
        .text(360, 300, 'LEVEL UP', { fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#fff' })
        .setOrigin(0.5)
    );

    SKILLS.forEach((def, i) => {
      const lv = levels[def.key] ?? 0;
      const maxed = lv >= def.max;
      const cx = 130 + i * 230;
      const cy = 660;
      const card = s.add.rectangle(cx, cy, 216, 440, maxed ? 0x3a2a2a : 0x7a2230).setStrokeStyle(4, maxed ? 0x555 : 0xe0b84e);
      c.add(card);
      c.add(s.add.circle(cx, cy - 190, 22, 0xe0b84e).setStrokeStyle(3, 0xfff0b0));
      c.add(s.add.text(cx, cy - 190, String(i + 1), { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#3a2a10' }).setOrigin(0.5));
      c.add(s.add.text(cx, cy - 120, def.name, { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffd34d', align: 'center' }).setOrigin(0.5));
      c.add(s.add.text(cx, cy - 10, def.desc, { fontFamily: 'sans-serif', fontSize: '17px', color: '#fff', align: 'center', wordWrap: { width: 190 } }).setOrigin(0.5));
      c.add(s.add.text(cx, cy + 170, `LV  ${lv} / ${def.max}`, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: maxed ? '#888' : '#7cf6ff' }).setOrigin(0.5));
      if (!maxed) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => {
          onPick(def.key);
          this.hide();
        });
      } else {
        c.add(s.add.text(cx, cy + 200, 'MAX', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ff7a7a' }).setOrigin(0.5));
      }
    });

    c.add(
      s.add
        .text(360, 980, 'PICK A SKILL', { fontFamily: 'sans-serif', fontSize: '34px', fontStyle: 'bold', color: '#ff9a3c' })
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
