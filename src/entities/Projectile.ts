import Phaser from 'phaser';

export interface ProjectileTarget {
  x: number;
  active: boolean;
  takeDamage(dmg: number): void;
}

export type ProjectileKind = 'arrow' | 'orb';

/**
 * 투사체 — 화살(빠르고 직선) / 마법 구슬(느리고 큼, 명중 시 광역).
 * 풀링으로 재사용.
 */
export class Projectile {
  private arrow: Phaser.GameObjects.Rectangle;
  private orb: Phaser.GameObjects.Arc;
  active = false;
  kind: ProjectileKind = 'arrow';
  private target: ProjectileTarget | null = null;
  private dmg = 0;
  private speed = 520;
  private life = 0;
  private onHit: ((x: number, dmg: number) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.arrow = scene.add.rectangle(0, 0, 22, 6, 0xffe14d).setStrokeStyle(1, 0x7a5a00, 0.8).setVisible(false).setDepth(50);
    this.orb = scene.add.circle(0, 0, 10, 0xb98cff).setStrokeStyle(2, 0xe0d0ff).setVisible(false).setDepth(50);
  }

  spawn(
    x: number,
    y: number,
    target: ProjectileTarget,
    dmg: number,
    kind: ProjectileKind,
    onHit?: (x: number, dmg: number) => void
  ): void {
    this.target = target;
    this.dmg = dmg;
    this.kind = kind;
    this.life = 0;
    this.active = true;
    this.onHit = onHit ?? null;
    this.speed = kind === 'orb' ? 360 : 560;
    if (kind === 'orb') {
      this.orb.setPosition(x, y).setVisible(true);
      this.arrow.setVisible(false);
    } else {
      this.arrow.setPosition(x, y).setVisible(true);
      this.orb.setVisible(false);
    }
  }

  private get obj(): Phaser.GameObjects.Components.Transform & { x: number } {
    return this.kind === 'orb' ? this.orb : this.arrow;
  }

  update(dt: number): boolean {
    if (!this.active) return true;
    this.life += dt;
    const t = this.target;
    const o = this.obj;
    if (!t || !t.active || this.life > 2.5) return true;
    const dir = Math.sign(t.x - o.x) || 1;
    o.x += dir * this.speed * dt;
    if (Math.abs(t.x - o.x) <= 16) {
      if (t.active) t.takeDamage(this.dmg);
      if (this.onHit) this.onHit(o.x, this.dmg); // 마법 구슬 광역
      return true;
    }
    return false;
  }

  deactivate(): void {
    this.active = false;
    this.target = null;
    this.onHit = null;
    this.arrow.setVisible(false);
    this.orb.setVisible(false);
  }
}
