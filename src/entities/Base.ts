import Phaser from 'phaser';

/** 기지(성) — HP가 0이 되면 패배 */
export class Base {
  private hpBar: Phaser.GameObjects.Rectangle;
  hp: number;
  readonly maxHp: number;
  readonly x: number;

  constructor(scene: Phaser.Scene, x: number, y: number, hp: number, color: number) {
    this.x = x;
    this.hp = hp;
    this.maxHp = hp;
    scene.add.rectangle(x, y, 60, 110, color).setStrokeStyle(3, 0xffffff, 0.3);
    this.hpBar = scene.add.rectangle(x - 30, y - 70, 60, 8, 0x5cff9e).setOrigin(0, 0.5);
  }

  takeDamage(dmg: number): void {
    this.hp = Math.max(0, this.hp - dmg);
    this.hpBar.setSize(Math.max(0, (this.hp / this.maxHp) * 60), 8);
  }

  get destroyed(): boolean {
    return this.hp <= 0;
  }
}
