import Phaser from 'phaser';
import type { UnitStats } from '../types';

/** 전투 화면 HUD — 골드/기지HP/웨이브 표시 + 유닛 소환 버튼 */
export class Hud {
  private goldText: Phaser.GameObjects.Text;
  private infoText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    units: Record<string, UnitStats>,
    onSpawn: (type: string) => void
  ) {
    this.goldText = scene.add
      .text(16, 14, '', { fontFamily: 'sans-serif', fontSize: '26px', color: '#ffd34d' })
      .setScrollFactor(0)
      .setDepth(100);
    this.infoText = scene.add
      .text(16, 46, '', { fontFamily: 'sans-serif', fontSize: '18px', color: '#cfe' })
      .setScrollFactor(0)
      .setDepth(100);

    // 유닛 소환 버튼 (하단)
    const keys = Object.keys(units);
    keys.forEach((key, i) => {
      const u = units[key];
      const x = 110 + i * 180;
      const y = 672;
      const btn = scene.add.rectangle(x, y, 160, 70, 0x20304e).setStrokeStyle(2, 0x4a9eff).setDepth(100);
      btn.setInteractive({ useHandCursor: true });
      scene.add
        .text(x, y - 12, u.name, { fontFamily: 'sans-serif', fontSize: '22px', color: '#fff' })
        .setOrigin(0.5)
        .setDepth(101);
      scene.add
        .text(x, y + 16, `🪙 ${u.cost}`, { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffd34d' })
        .setOrigin(0.5)
        .setDepth(101);
      btn.on('pointerdown', () => onSpawn(key));
    });
  }

  update(gold: number, playerHp: number, playerMax: number, enemyHp: number, enemyMax: number): void {
    this.goldText.setText(`🪙 ${gold}`);
    this.infoText.setText(`🏰 우리 ${playerHp}/${playerMax}    🎯 적 생산기지 ${enemyHp}/${enemyMax}`);
  }
}
