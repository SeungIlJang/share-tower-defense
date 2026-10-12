import Phaser from 'phaser';
import type { CombatStats, Side } from '../types';
import { applyDamage } from '../systems/combat';

/**
 * 전투 유닛 공통 베이스 (유닛/적 공유).
 * 프로토타입: 사각형 + HP바. 2단계에서 Spine 스프라이트로 교체 예정.
 * 풀링을 위해 생성자에서 비주얼을 만들고 spawn/deactivate로 재사용한다.
 */
export class Fighter {
  readonly body: Phaser.GameObjects.Rectangle;
  private hpBarBg: Phaser.GameObjects.Rectangle;
  private hpBar: Phaser.GameObjects.Rectangle;

  stats!: CombatStats;
  type = '';
  side: Side = 'ally';
  hp = 0;
  maxHp = 0;
  cooldown = 0; // 남은 공격 쿨다운(초)
  active = false;

  constructor(
    scene: Phaser.Scene,
    private color: number
  ) {
    this.body = scene.add.rectangle(0, 0, 28, 40, color).setVisible(false);
    this.hpBarBg = scene.add.rectangle(0, 0, 30, 5, 0x222831).setVisible(false);
    this.hpBar = scene.add.rectangle(0, 0, 30, 5, 0x5cff9e).setOrigin(0, 0.5).setVisible(false);
  }

  spawn(x: number, y: number, stats: CombatStats, type: string, side: Side): void {
    this.stats = stats;
    this.type = type;
    this.side = side;
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.cooldown = 0;
    this.active = true;
    this.body.fillColor = this.color;
    this.body.setPosition(x, y).setVisible(true);
    this.syncBars();
    this.hpBarBg.setVisible(true);
    this.hpBar.setVisible(true);
  }

  takeDamage(dmg: number): void {
    this.hp = applyDamage(this.hp, dmg);
    this.syncBars();
  }

  get x(): number {
    return this.body.x;
  }

  moveBy(dx: number): void {
    this.body.x += dx;
    this.syncBars();
  }

  private syncBars(): void {
    const w = 30;
    const topY = this.body.y - this.body.height / 2 - 8;
    this.hpBarBg.setPosition(this.body.x, topY);
    this.hpBar
      .setPosition(this.body.x - w / 2, topY)
      .setSize(Math.max(0, (this.hp / this.maxHp) * w), 5);
  }

  deactivate(): void {
    this.active = false;
    this.body.setVisible(false);
    this.hpBar.setVisible(false);
    this.hpBarBg.setVisible(false);
  }
}
