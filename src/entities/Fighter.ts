import Phaser from 'phaser';
import type { CombatStats, Side } from '../types';
import { applyDamage } from '../systems/combat';
import { buildChar, visualOf } from './visuals';
import { animKey, resolveState, spriteOf, textureKey, type AnimState, type SpriteDef } from '../systems/sprites';

/** 📱 유닛 표시 배율 — 휴대폰에서 잘 보이게 전체 크기 확대(능력치·사거리는 그대로) */
export const UNIT_SCALE = 1.5;

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
  private stars: Phaser.GameObjects.Text; // ⭐ 진화 단계
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private spriteDef: SpriteDef | null = null;
  private anim: AnimState = 'idle';
  private statusTint: number | null = null; // 빙결·수호·광폭 등 상태 색

  stats!: CombatStats;
  type = '';
  side: Side = 'ally';
  hp = 0;
  maxHp = 0;
  cooldown = 0;
  active = false;
  swings = 0; // 누적 공격 수(스킬 발동 판정)
  slowUntil = 0; // 이동 50% 감속 끝나는 시각(ms, scene.time.now)
  guardUntil = 0; // 받는 피해 50% 감소 끝나는 시각(ms)
  stunUntil = 0; // 기절 끝나는 시각(ms) — 보스 땅 내려치기
  patternT = 0; // 보스 패턴 타이머(초)
  summonT = 0; // 보스 부하 소환 타이머(초)
  elite = false; // ⭐ 엘리트 적
  private baseTint: number | null = null; // 엘리트 금빛 등 기본 색

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.char = scene.add.container(0, 0);
    this.flash = scene.add.rectangle(0, 0, 36, 46, 0xffffff, 0).setAlpha(0);
    this.hpBg = scene.add.rectangle(0, -40, 30, 5, 0x1a1f2a);
    this.hpBar = scene.add.rectangle(-15, -40, 30, 5, 0x5cff9e).setOrigin(0, 0.5);
    this.stars = scene.add
      .text(0, -60, '', { fontFamily: 'sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#ffd34d', stroke: '#3a2a00', strokeThickness: 3 })
      .setOrigin(0.5)
      .setVisible(false);
    this.root = scene.add.container(0, 0, [this.char, this.flash, this.hpBg, this.hpBar, this.stars]).setVisible(false);
  }

  /** 텍스처·애니 이름(스킨 적용 시 '유닛@스킨') */
  private look = '';

  spawn(x: number, y: number, stats: CombatStats, type: string, side: Side, look = type): void {
    this.look = look;
    this.stats = stats;
    this.type = type;
    this.side = side;
    this.hp = stats.hp;
    this.maxHp = stats.hp;
    this.cooldown = 0;
    this.active = true;
    this.statusTint = null;
    this.swings = 0;
    this.slowUntil = 0;
    this.guardUntil = 0;
    this.stunUntil = 0;
    this.patternT = 0;
    this.summonT = 0;
    this.elite = false;
    this.baseTint = null;
    this.root.setScale(UNIT_SCALE);

    // 외형 재구성
    this.char.removeAll(true);
    this.char.x = 0;
    this.char.scaleX = side === 'enemy' ? -1 : 1;
    this.sprite = null;
    this.spriteDef = spriteOf(look) ?? spriteOf(type) ?? null; // 전설 스킨은 자기 시트 정보
    const v = visualOf(type);
    const footOffset = v.bodyH / 2; // 벡터 캐릭터와 같은 높이에 발을 둠
    let barY = -v.bodyH / 2 - 20;

    if (this.spriteDef && this.scene.textures.exists(textureKey(look))) {
      const d = this.spriteDef;
      const s = this.scene.add
        .sprite(0, footOffset, textureKey(look), d.anims.idle!.frames[0])
        .setOrigin(0.5, d.footY / d.frameHeight)
        .setScale(d.scale);
      this.char.add([this.scene.add.ellipse(0, footOffset + 2, d.frameWidth * d.scale * 0.6, 8, 0x000000, 0.25), s]);
      this.sprite = s;
      this.anim = 'idle';
      s.play(animKey(look, 'idle'));
      barY = footOffset - d.footY * d.scale - 8;
      this.flash.setAlpha(0);
    } else {
      this.spriteDef = null;
      this.char.add(buildChar(this.scene, type));
      this.flash.setSize(v.bodyW + 6, v.bodyH + 6).setAlpha(0);
    }
    this.hpBg.setY(barY);
    this.hpBar.setY(barY);
    this.stars.setY(barY - 9).setVisible(false);

    this.root.setPosition(x, y).setVisible(true);
    this.updateHp();
  }

  /** ⭐ 엘리트로 만들기 — 크기 1.3배 + 금빛(능력치는 Battle에서) */
  makeElite(): void {
    this.elite = true;
    this.baseTint = 0xffe08a;
    this.root.setScale(UNIT_SCALE * 1.3);
    if (this.sprite) this.applyTint(this.sprite);
    this.updateHp();
  }

  get stunned(): boolean {
    return this.scene.time.now < this.stunUntil;
  }

  /** 감속 중이면 0.5 */
  get speedMult(): number {
    return this.scene.time.now < this.slowUntil ? 0.5 : 1;
  }

  takeDamage(dmg: number, crit = false): void {
    if (this.scene.time.now < this.guardUntil) dmg = Math.max(1, Math.round(dmg * 0.5)); // 철벽의 의지
    this.hp = applyDamage(this.hp, dmg);
    if (this.side === 'enemy') this.damageNumber(dmg, crit);
    this.updateHp();
    if (this.sprite) {
      // 스프라이트: 흰색으로 잠깐 채움
      const s = this.sprite;
      s.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
      this.scene.time.delayedCall(90, () => s.active && this.applyTint(s));
      return;
    }
    this.flash.setAlpha(0.65);
    this.scene.tweens.add({ targets: this.flash, alpha: 0, duration: 130 });
  }

  /**
   * 상태 표시 — tint 색(없으면 해제), paused면 애니메이션 정지(빙결).
   * 벡터 캐릭터는 몸 위에 반투명 색을 덮는다.
   */
  setStatus(tint: number | null, paused = false): void {
    this.statusTint = tint;
    if (this.sprite) {
      this.applyTint(this.sprite);
      if (paused) this.sprite.anims.pause();
      else if (this.sprite.anims.isPaused) this.sprite.anims.resume();
    } else {
      this.flash.setFillStyle(tint ?? 0xffffff, 1).setAlpha(tint === null ? 0 : 0.35);
    }
  }

  private applyTint(s: Phaser.GameObjects.Sprite): void {
    s.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
    const tint = this.statusTint ?? this.baseTint;
    if (tint !== null) s.setTint(tint);
  }

  /** 💥 피해 숫자(적이 맞을 때) — 치명타는 크고 주황색 */
  private damageNumber(dmg: number, crit: boolean): void {
    const y = this.root.y - 40 * UNIT_SCALE - Math.random() * 12;
    const t = this.scene.add
      .text(this.root.x + (Math.random() * 16 - 8), y, crit ? `${dmg}!` : String(dmg), {
        fontFamily: 'sans-serif',
        fontSize: crit ? '24px' : '15px',
        fontStyle: 'bold',
        color: crit ? '#ffb02e' : '#ffffff',
        stroke: '#000000',
        strokeThickness: crit ? 5 : 3,
      })
      .setOrigin(0.5)
      .setDepth(88);
    if (crit) t.setScale(0.5);
    this.scene.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: t, y: y - 32, alpha: 0, delay: crit ? 380 : 220, duration: 420, onComplete: () => t.destroy() });
  }

  /** 회복(최대 HP까지) */
  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    this.updateHp();
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

  /** 스킬 동작 — skill 애니(없으면 공격 애니·찌르기) */
  skillMotion(): void {
    if (this.sprite && this.spriteDef && (this.spriteDef.anims.skill || this.spriteDef.anims.attack)) {
      this.play('skill');
      return;
    }
    this.lunge();
  }

  /** ⭐ 진화 단계 표시(★★ 이상만, HP 바 위) */
  setStars(n: number): void {
    this.stars.setText('★'.repeat(n)).setVisible(n >= 2);
  }

  /** 몸 크기 배율(👑 영웅 등) */
  setBodyScale(m: number): void {
    this.root.setScale(UNIT_SCALE * m);
  }

  /** 바라보는 방향(1=오른쪽, -1=왼쪽) — 👑 영웅이 뒤로 걸을 때 */
  faceDir(d: 1 | -1): void {
    this.char.scaleX = d;
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
      .setScale(d.scale * this.root.scale)
      .setFlipX(this.side === 'enemy')
      .setDepth(this.root.depth);
    corpse.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.scene.tweens.add({ targets: corpse, alpha: 0, duration: 250, onComplete: () => corpse.destroy() });
    });
    corpse.play(animKey(this.look, 'death'));
    return true;
  }

  private play(state: AnimState): void {
    const s = this.sprite;
    const d = this.spriteDef;
    if (!s || !d) return;
    // 공격·스킬 애니 재생 중엔 끝날 때까지 유지
    const oneShot = (a: AnimState): boolean => a === 'attack' || a === 'skill';
    if (oneShot(this.anim) && s.anims.isPlaying && !oneShot(state)) return;
    const next = resolveState(d, state);
    if (!next) return;
    if (next === this.anim && s.anims.isPlaying && !oneShot(next)) return;
    this.anim = next;
    s.play(animKey(this.look, next));
    if (oneShot(next)) {
      s.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.sprite === s && oneShot(this.anim)) {
          this.anim = 'idle';
          s.play(animKey(this.look, 'idle'));
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
