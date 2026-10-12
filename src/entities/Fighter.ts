import Phaser from 'phaser';
import type { CombatStats, Side } from '../types';
import { applyDamage } from '../systems/combat';
import { buildChar, visualOf } from './visuals';

/**
 * 전투 유닛 공통 베이스. 타입별로 다른 캐릭터(몸/머리/무기)를 컨테이너로 구성.
 * 풀링: 생성자에서 컨테이너를 만들고 spawn 때 외형을 다시 그린다.
 */
export class Fighter {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private char: Phaser.GameObjects.Container;
  private flash: Phaser.GameObjects.Rectangle;
  private hpBg: Phaser.GameObjects.Rectangle;
  private hpBar: Phaser.GameObjects.Rectangle;

  stats!: CombatStats;
  type = '';
  side: Side = 'ally';
  hp = 0;
  maxHp = 0;
  cooldown = 0;
  active = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.char = scene.add.container(0, 0);
    this.flash = scene.add.rectangle(0, 0, 36, 46, 0xffffff, 0).setAlpha(0);
    this.hpBg = scene.add.rectangle(0, -40, 30, 5, 0x1a1f2a);
    this.hpBar = scene.add.rectangle(-15, -40, 30, 5, 0x5cff9e).setOrigin(0, 0.5);
    this.root = scene.add.container(0, 0, [this.char, this.flash, this.hpBg, this.hpBar]).setVisible(false);
  }

  spawn(x: number, y: number, stats: CombatStats, type: string, side: Side): void {
    this.stats = stats;
    this.type = type;
    this.side = side;
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.cooldown = 0;
    this.active = true;

    // 외형 재구성
    this.char.removeAll(true);
    this.char.add(buildChar(this.scene, type));
    this.char.scaleX = side === 'enemy' ? -1 : 1;
    const v = visualOf(type);
    this.flash.setSize(v.bodyW + 6, v.bodyH + 6).setAlpha(0);
    this.hpBg.setY(-v.bodyH / 2 - 20);
    this.hpBar.setY(-v.bodyH / 2 - 20);

    this.root.setPosition(x, y).setVisible(true);
    this.updateHp();
  }

  takeDamage(dmg: number): void {
    this.hp = applyDamage(this.hp, dmg);
    this.updateHp();
    this.flash.setAlpha(0.65);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 130 });
  }

  /** 공격 시 앞으로 살짝 찌르는 모션 */
  lunge(): void {
    const dir = this.side === 'ally' ? 1 : -1;
    this.scene.tweens.add({ targets: this.char, x: dir * 7, duration: 70, yoyo: true });
  }

  get x(): number {
    return this.root.x;
  }

  moveBy(dx: number): void {
    this.root.x += dx;
  }

  private updateHp(): void {
    this.hpBar.width = Math.max(0, (this.hp / this.maxHp) * 30);
  }

  deactivate(): void {
    this.active = false;
    this.root.setVisible(false);
  }
}
