import Phaser from 'phaser';
import type { CombatStats, Side } from '../types';
import { applyDamage } from '../systems/combat';
import { buildChar, visualOf } from './visuals';
import { animKey, resolveState, spriteOf, textureKey, type AnimState, type SpriteDef } from '../systems/sprites';

/**
 * 전투 유닛 공통 베이스. 스프라이트 매니페스트에 있는 타입은 픽셀아트 스프라이트,
 * 없는 타입은 벡터 도형(몸/머리/무기)으로 그린다.
 * 풀링: 생성자에서 컨테이너를 만들고 spawn 때 외형을 다시 그린다.
 */
export class Fighter {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private char: Phaser.GameObjects.Container;
  private flash: Phaser.GameObjects.Rectangle;
  private hpBg: Phaser.GameObjects.Rectangle;
  private hpBar: Phaser.GameObjects.Rectangle;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private spriteDef: SpriteDef | null = null;
  private anim: AnimState = 'idle';

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
    this.char.x = 0;
    this.char.scaleX = side === 'enemy' ? -1 : 1;
    this.sprite = null;
    this.spriteDef = spriteOf(type) ?? null;
    const v = visualOf(type);
    const footOffset = v.bodyH / 2; // 벡터 캐릭터와 같은 높이에 발을 둠
    let barY = -v.bodyH / 2 - 20;

    if (this.spriteDef && this.scene.textures.exists(textureKey(type))) {
      const d = this.spriteDef;
      const s = this.scene.add
        .sprite(0, footOffset, textureKey(type), d.anims.idle!.frames[0])
        .setOrigin(0.5, d.footY / d.frameHeight)
        .setScale(d.scale);
      this.char.add([this.scene.add.ellipse(0, footOffset + 2, d.frameWidth * d.scale * 0.6, 8, 0x000000, 0.25), s]);
      this.sprite = s;
      this.anim = 'idle';
      s.play(animKey(type, 'idle'));
      barY = footOffset - d.footY * d.scale - 8;
      this.flash.setAlpha(0);
    } else {
      this.spriteDef = null;
      this.char.add(buildChar(this.scene, type));
      this.flash.setSize(v.bodyW + 6, v.bodyH + 6).setAlpha(0);
    }
    this.hpBg.setY(barY);
    this.hpBar.setY(barY);

    this.root.setPosition(x, y).setVisible(true);
    this.updateHp();
  }

  takeDamage(dmg: number): void {
    this.hp = applyDamage(this.hp, dmg);
    this.updateHp();
    if (this.sprite) {
      // 스프라이트: 흰색으로 잠깐 채움
      const s = this.sprite;
      s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.scene.time.delayedCall(90, () => s.active && s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY));
      return;
    }
    this.flash.setAlpha(0.65);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 130 });
  }

  /** 공격 모션 — 스프라이트는 attack 애니(없으면 찌르기), 벡터는 앞으로 살짝 찌르기 */
  lunge(): void {
    if (this.sprite && this.spriteDef?.anims.attack) {
      this.play('attack');
      return;
    }
    const dir = this.side === 'ally' ? 1 : -1;
    this.scene.tweens.add({ targets: this.char, x: dir * 7, duration: 70, yoyo: true });
  }

  /** 제자리 대기(사거리 안에서 쿨다운 중) */
  idle(): void {
    this.play('idle');
  }

  get x(): number {
    return this.root.x;
  }

  moveBy(dx: number): void {
    this.root.x += dx;
    this.play('walk');
  }

  /** 사망 연출 — death 애니가 있으면 그 자리에 1회용 스프라이트를 남김(풀과 무관) */
  playDeath(): boolean {
    const d = this.spriteDef;
    if (!this.sprite || !d || !resolveState(d, 'death')) return false;
    const s = this.sprite;
    const corpse = this.scene.add
      .sprite(this.root.x, this.root.y + s.y, s.texture.key)
      .setOrigin(s.originX, s.originY)
      .setScale(d.scale)
      .setFlipX(this.side === 'enemy')
      .setDepth(this.root.depth);
    corpse.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.scene.tweens.add({ targets: corpse, alpha: 0, duration: 250, onComplete: () => corpse.destroy() });
    });
    corpse.play(animKey(this.type, 'death'));
    return true;
  }

  private play(state: AnimState): void {
    const s = this.sprite;
    const d = this.spriteDef;
    if (!s || !d) return;
    // 공격 애니 재생 중엔 끝날 때까지 유지
    if (this.anim === 'attack' && s.anims.isPlaying && state !== 'attack') return;
    const next = resolveState(d, state);
    if (!next) return;
    if (next === this.anim && s.anims.isPlaying && next !== 'attack') return;
    this.anim = next;
    s.play(animKey(this.type, next));
    if (next === 'attack') {
      s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.sprite === s && this.anim === 'attack') {
          this.anim = 'idle';
          s.play(animKey(this.type, 'idle'));
        }
      });
    }
  }

  private updateHp(): void {
    this.hpBar.width = Math.max(0, (this.hp / this.maxHp) * 30);
  }

  deactivate(): void {
    this.active = false;
    this.root.setVisible(false);
    this.sprite?.stop();
  }
}
