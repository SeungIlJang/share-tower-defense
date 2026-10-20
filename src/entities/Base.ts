import Phaser from 'phaser';
import { damageStage, spriteOf, textureKey } from '../systems/sprites';

const RECT_W = 60;
const RECT_H = 110;
const BASE_SCALE = 1.9; // 🏰 성의 위압감 — 크게

/**
 * 기지(성) — HP가 0이 되면 패배.
 * 매니페스트에 spriteKey(base_ally / base_enemy)가 있으면 이미지로, 없으면 사각형.
 * 이미지 프레임이 여러 장이면 파손 단계(0=멀쩡 → 마지막=거의 무너짐)로 HP에 따라 교체.
 */
export class Base {
  private hpBar: Phaser.GameObjects.Rectangle;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private stages: number[] = [];
  hp: number;
  readonly maxHp: number;
  readonly x: number;
  readonly top: number = 0; // 성 꼭대기 y(체력 바 위치)

  constructor(
    private scene: Phaser.Scene,
    x: number,
    y: number,
    hp: number,
    color: number,
    spriteKey: string
  ) {
    this.x = x;
    this.hp = hp;
    this.maxHp = hp;
    const def = spriteOf(spriteKey);
    let barY = y - 70;
    if (def && scene.textures.exists(textureKey(spriteKey))) {
      const ground = y + RECT_H / 2; // 사각형 기지 바닥과 같은 높이에 세움
      this.stages = def.anims.idle!.frames;
      this.sprite = scene.add
        .sprite(x, ground, textureKey(spriteKey), this.stages[0])
        .setOrigin(0.5, def.footY / def.frameHeight)
        .setScale(def.scale * BASE_SCALE)
        .setDepth(-1); // 유닛보다 뒤
      const w = def.frameWidth * def.scale * BASE_SCALE;
      scene.add.ellipse(x, ground + 4, w * 0.9, 26, 0x000000, 0.35).setDepth(-2); // 바닥 그림자(묵직하게)
      barY = ground - def.footY * def.scale * BASE_SCALE - 8;
    } else {
      scene.add.rectangle(x, y, RECT_W, RECT_H, color).setStrokeStyle(3, 0xffffff, 0.3);
    }
    this.top = barY;
    this.hpBar = scene.add.rectangle(x - 40, barY, 80, 10, 0x5cff9e).setOrigin(0, 0.5);
  }

  takeDamage(dmg: number): void {
    this.hp = Math.max(0, this.hp - dmg);
    this.refresh();
    if (this.sprite) {
      const s = this.sprite;
      s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.scene.time.delayedCall(70, () => s.active && s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
    }
  }

  /** 회복/부활 — HP 되살리고 바 갱신 */
  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.refresh();
  }

  private refresh(): void {
    this.hpBar.setSize(Math.max(0, (this.hp / this.maxHp) * 80), 10);
    if (this.sprite && this.stages.length > 1) {
      this.sprite.setFrame(this.stages[damageStage(this.hp, this.maxHp, this.stages.length)]);
    }
  }

  get destroyed(): boolean {
    return this.hp <= 0;
  }
}
