import Phaser from 'phaser';

/** 투사체가 추적할 대상(유닛/적) 최소 인터페이스 */
export interface ProjectileTarget {
  x: number;
  active: boolean;
  takeDamage(dmg: number): void;
}

/**
 * 투사체(화살 등) — 발사 시 데미지를 들고 대상에게 날아가 명중 시 적용.
 * 풀링으로 재사용(대량 발사 성능).
 */
export class Projectile {
  private g: Phaser.GameObjects.Rectangle;
  active = false;
  private target: ProjectileTarget | null = null;
  private dmg = 0;
  private speed = 520;
  private life = 0;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.rectangle(0, 0, 22, 6, 0xffe14d).setVisible(false).setDepth(50);
    this.g.setStrokeStyle(1, 0x7a5a00, 0.8);
  }

  spawn(x: number, y: number, target: ProjectileTarget, dmg: number, color: number): void {
    this.target = target;
    this.dmg = dmg;
    this.life = 0;
    this.active = true;
    this.g.fillColor = color;
    this.g.setPosition(x, y).setVisible(true);
  }

  /** 프레임 갱신 — 완료(명중/소멸) 시 true */
  update(dt: number): boolean {
    if (!this.active) return true;
    this.life += dt;
    const t = this.target;
    if (!t || !t.active || this.life > 2) return true; // 대상 소멸/수명초과 → 제거
    const dx = t.x - this.g.x;
    const dir = Math.sign(dx) || 1;
    this.g.x += dir * this.speed * dt;
    if (Math.abs(t.x - this.g.x) <= 16) {
      if (t.active) t.takeDamage(this.dmg);
      return true;
    }
    return false;
  }

  deactivate(): void {
    this.active = false;
    this.target = null;
    this.g.setVisible(false);
  }
}
