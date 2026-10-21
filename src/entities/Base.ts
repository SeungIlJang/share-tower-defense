import Phaser from 'phaser';
import { damageStage, spriteOf, textureKey } from '../systems/sprites';

const RECT_W = 60;
const RECT_H = 110;
const BASE_SCALE = 1.9; // 🏰 성의 위압감 — 크게

/**
 * 기지(성) — HP가 0이 되면 패배.
 * 매니페스트에 그림이 있으면 이미지로, 없으면 사각형. 프레임이 여러 장이면 파손 단계(0=멀쩡 → 마지막=무너짐).
 * 🏰 setLook으로 단계별 그림(base_ally_t3 등)으로 교체 — 그 그림이 없으면 기본 그림(looks 목록 뒤쪽) 사용.
 */
export class Base {
  private hpBar: Phaser.GameObjects.Rectangle;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private shadow: Phaser.GameObjects.Ellipse | null = null;
  private rect: Phaser.GameObjects.Rectangle | null = null;
  private stages: number[] = [];
  private readonly ground: number;
  hp: number;
  maxHp: number;
  readonly x: number;
  top = 0; // 성 꼭대기 y(체력 바 위치) — 발사 위치
  look = ''; // 지금 그림 키

  constructor(
    private scene: Phaser.Scene,
    x: number,
    private y: number,
    hp: number,
    private color: number,
    looks: string | string[], // 앞에서부터 있는 그림을 씀
    sizeMult = 1
  ) {
    this.x = x;
    this.hp = hp;
    this.maxHp = hp;
    this.ground = y + RECT_H / 2; // 사각형 기지 바닥과 같은 높이에 세움
    this.hpBar = scene.add.rectangle(x - 40, 0, 80, 10, 0x5cff9e).setOrigin(0, 0.5);
    this.setLook(looks, sizeMult);
  }

  /** 🏰 그림 바꾸기(단계 진화) — 체력 비율·파손 단계 유지 */
  setLook(looks: string | string[], sizeMult = 1): void {
    const list = Array.isArray(looks) ? looks : [looks];
    const key = list.find((k) => spriteOf(k) && this.scene.textures.exists(textureKey(k)));
    this.sprite?.destroy();
    this.shadow?.destroy();
    this.rect?.destroy();
    this.sprite = null;
    this.shadow = null;
    this.rect = null;
    let barY = this.y - 70;
    if (key) {
      const def = spriteOf(key)!;
      const sc = def.scale * BASE_SCALE * sizeMult;
      this.stages = def.anims.idle!.frames;
      // 넓은 성(★3 이상)은 화면 밖으로 잘리지 않게 안쪽으로(우리 성 = 왼쪽 끝, 적 성 = 오른쪽 끝 기준)
      const half = (def.frameWidth * sc) / 2;
      const sx = this.x < 640 ? Math.max(this.x, 6 + half) : Math.min(this.x, 1274 - half);
      this.sprite = this.scene.add
        .sprite(sx, this.ground, textureKey(key), this.stages[0])
        .setOrigin(0.5, def.footY / def.frameHeight)
        .setScale(sc)
        .setDepth(-1); // 유닛보다 뒤
      this.shadow = this.scene.add.ellipse(sx, this.ground + 4, def.frameWidth * sc * 0.9, 26, 0x000000, 0.35).setDepth(-2); // 바닥 그림자(묵직하게)
      barY = this.ground - def.footY * sc - 8;
      this.look = key;
    } else {
      this.stages = [];
      this.rect = this.scene.add.rectangle(this.x, this.y, RECT_W, RECT_H, this.color).setStrokeStyle(3, 0xffffff, 0.3);
      this.look = '';
    }
    this.top = Math.max(barY, 70); // 상단 바에 가리지 않게
    this.hpBar.setPosition((this.sprite?.x ?? this.x) - 40, this.top); // 체력 바는 성 그림 가운데 위
    this.refresh();
  }

  /** 최대 체력 바꾸기(성 강화) — 체력 비율 유지 */
  setMaxHp(maxHp: number): void {
    const r = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    this.maxHp = maxHp;
    this.hp = Math.round(maxHp * r);
    this.refresh();
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

  /** 🏹 쏘는 순간 반동 */
  recoil(): void {
    const s = this.sprite;
    if (!s) return;
    this.scene.tweens.killTweensOf(s);
    s.setScale(s.scaleX); // 이전 반동이 남지 않게 원래 비율로
    this.scene.tweens.add({ targets: s, scaleY: s.scaleX * 0.97, duration: 70, yoyo: true });
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
