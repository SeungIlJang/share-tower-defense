import Phaser from 'phaser';
import unitsData from '../data/units.json';
import type { UnitStats } from '../types';
import { lockedUntil } from '../systems/unlocks';
import { meta, scaleStat } from '../systems/upgrades';

const UNITS = unitsData as Record<string, UnitStats>;

/** 유닛 영구 강화 씬 — 메타 골드로 hp·atk 강화 */
export class UpgradeScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;
  private goldText!: Phaser.GameObjects.Text;

  constructor() {
    super('Upgrade');
  }

  create(): void {
    this.add
      .text(640, 54, '🔧 유닛 강화', { fontFamily: 'sans-serif', fontSize: '40px', color: '#ffd34d' })
      .setOrigin(0.5);
    this.goldText = this.add
      .text(640, 100, '', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffe14d' })
      .setOrigin(0.5);
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

    const keys = Object.keys(UNITS);
    const locks = lockedUntil(keys, meta.clearedMax);
    keys.forEach((key, i) => {
      const u = UNITS[key];
      const locked = locks[key]; // 0 = 해금됨
      const lv = meta.level(key);
      const y = 170 + i * 110;
      const canUp = !locked && meta.canUpgrade(key);
      const cost = meta.nextCost(key);

      const row = this.add.rectangle(640, y, 760, 92, 0x1a2338).setStrokeStyle(2, 0x33406a);
      const name = this.add.text(300, y - 22, `${u.name}  Lv.${lv}`, {
        fontFamily: 'sans-serif',
        fontSize: '24px',
        color: '#fff',
      });
      const stat = this.add.text(300, y + 10, `❤️ ${scaleStat(u.hp, lv)}  ⚔️ ${scaleStat(u.atk, lv)}  →  Lv.${lv + 1}: ❤️ ${scaleStat(u.hp, lv + 1)} ⚔️ ${scaleStat(u.atk, lv + 1)}`, {
        fontFamily: 'sans-serif',
        fontSize: '15px',
        color: '#9fb3d0',
      });
      const btn = this.add
        .rectangle(880, y, 150, 60, canUp ? 0x2f7a4d : 0x3a3f55)
        .setStrokeStyle(2, canUp ? 0x5cff9e : 0x555)
        .setInteractive({ useHandCursor: true });
      const btnText = this.add
        .text(880, y, locked ? `🔒 ${locked}스테이지\n클리어` : `강화\n🪙${cost}`, {
          fontFamily: 'sans-serif',
          fontSize: '16px',
          color: '#fff',
          align: 'center',
        })
        .setOrigin(0.5);
      btn.on('pointerdown', () => {
        if (!locked && meta.upgrade(key)) this.render();
      });
      this.layer.add([row, name, stat, btn, btnText]);
    });
  }
}
