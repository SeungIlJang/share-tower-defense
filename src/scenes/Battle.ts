import Phaser from 'phaser';
import unitsData from '../data/units.json';
import enemiesData from '../data/enemies.json';
import stagesData from '../data/stages.json';
import type { UnitStats, EnemyStats, StageData } from '../types';
import { Unit } from '../entities/Unit';
import { Enemy } from '../entities/Enemy';
import { Base } from '../entities/Base';
import { Pool } from '../utils/pool';
import { ResourceSystem } from '../systems/resources';
import { WaveSystem } from '../systems/waves';
import { computeDamage, attackCooldown, inRange } from '../systems/combat';
import { Hud } from '../ui/Hud';

const UNITS = unitsData as Record<string, UnitStats>;
const ENEMIES = enemiesData as Record<string, EnemyStats>;
const STAGES = stagesData as StageData[];

const LANE_Y = 500;

export class BattleScene extends Phaser.Scene {
  private stage!: StageData;
  private resources!: ResourceSystem;
  private waves!: WaveSystem;
  private hud!: Hud;
  private playerBase!: Base;
  private enemyBase!: Base;

  private unitPool!: Pool<Unit>;
  private enemyPool!: Pool<Enemy>;
  private units: Unit[] = [];
  private enemies: Enemy[] = [];
  private over = false;

  constructor() {
    super('Battle');
  }

  init(data: { stageId: number }): void {
    this.stage = STAGES.find((s) => s.id === data.stageId) ?? STAGES[0];
  }

  create(): void {
    this.over = false;
    this.units = [];
    this.enemies = [];

    // 배경 + 레인
    this.add.rectangle(640, 360, 1280, 720, 0x121826).setDepth(-10);
    this.add.rectangle(640, LANE_Y + 40, 1280, 90, 0x1d2740).setDepth(-5);
    this.add.rectangle(640, LANE_Y + 2, 1280, 3, 0x33406a).setDepth(-4);

    this.playerBase = new Base(this, 90, LANE_Y - 10, this.stage.baseHp, 0x2f6fe0);
    this.enemyBase = new Base(this, 1190, LANE_Y - 10, this.stage.baseHp, 0xc0392b);

    this.resources = new ResourceSystem(this.stage.startGold, this.stage.goldRate);
    this.waves = new WaveSystem(this.stage);

    this.unitPool = new Pool<Unit>(
      () => new Unit(this),
      (u) => u.deactivate()
    );
    this.enemyPool = new Pool<Enemy>(
      () => new Enemy(this),
      (e) => e.deactivate()
    );

    this.hud = new Hud(this, UNITS, (type) => this.trySpawnUnit(type));
  }

  private trySpawnUnit(type: string): void {
    if (this.over) return;
    const stats = UNITS[type];
    if (!stats || !this.resources.spend(stats.cost)) return;
    const u = this.unitPool.acquire();
    u.spawn(this.playerBase.x + 50, LANE_Y, stats, type, 'ally');
    this.units.push(u);
  }

  private spawnEnemy(type: string): void {
    const stats = ENEMIES[type];
    if (!stats) return;
    const e = this.enemyPool.acquire();
    e.spawn(this.enemyBase.x - 50, LANE_Y, stats, type, 'enemy');
    e.reward = stats.reward;
    this.enemies.push(e);
  }

  private nearest(x: number, list: { x: number; active: boolean }[]): { x: number } | null {
    let best: { x: number } | null = null;
    let bestD = Infinity;
    for (const o of list) {
      if (!o.active) continue;
      const d = Math.abs(o.x - x);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  update(_time: number, deltaMs: number): void {
    if (this.over) return;
    const dt = Math.min(0.05, deltaMs / 1000);

    this.resources.update(dt);
    for (const ev of this.waves.update(dt)) this.spawnEnemy(ev.type);

    // 아군: 적 추격/공격, 없으면 전진 → 적 기지 공격
    for (const u of this.units) {
      if (!u.active) continue;
      const target = this.nearest(u.x, this.enemies) as Enemy | null;
      u.cooldown -= dt;
      if (target && inRange(u.x, target.x, u.stats.range)) {
        this.attack(u, target);
      } else if (target) {
        u.moveBy(u.stats.speed * dt);
      } else if (inRange(u.x, this.enemyBase.x, u.stats.range)) {
        if (u.cooldown <= 0) {
          this.enemyBase.takeDamage(computeDamage(u.stats.atk, 0));
          u.cooldown = attackCooldown(u.stats.atkSpeed);
        }
      } else {
        u.moveBy(u.stats.speed * dt);
      }
    }

    // 적: 아군 추격/공격, 없으면 전진 → 플레이어 기지 공격
    for (const e of this.enemies) {
      if (!e.active) continue;
      const target = this.nearest(e.x, this.units) as Unit | null;
      e.cooldown -= dt;
      if (target && inRange(e.x, target.x, e.stats.range)) {
        this.attack(e, target);
      } else if (target) {
        e.moveBy(-e.stats.speed * dt);
      } else if (inRange(e.x, this.playerBase.x, e.stats.range)) {
        if (e.cooldown <= 0) {
          this.playerBase.takeDamage(computeDamage(e.stats.atk, 0));
          e.cooldown = attackCooldown(e.stats.atkSpeed);
        }
      } else {
        e.moveBy(-e.stats.speed * dt);
      }
    }

    this.cleanupDead();
    this.hud.update(
      this.resources.amount,
      this.playerBase.hp,
      this.playerBase.maxHp,
      this.enemies.filter((e) => e.active).length + (this.waves.totalCount - this.spawnedCount())
    );
    this.checkEnd();
  }

  private attack(att: Unit | Enemy, def: Unit | Enemy): void {
    if (att.cooldown > 0) return;
    def.takeDamage(computeDamage(att.stats.atk, def.stats.def));
    att.cooldown = attackCooldown(att.stats.atkSpeed);
  }

  private spawnedCount(): number {
    // 이미 소환된 적 수 추정(총 - 남은 큐). WaveSystem이 finished면 전부 소환됨.
    return this.waves.finished ? this.waves.totalCount : this.enemies.length;
  }

  private cleanupDead(): void {
    for (const e of this.enemies) {
      if (e.active && e.hp <= 0) {
        this.resources.add(e.reward);
        this.enemyPool.release(e);
      }
    }
    for (const u of this.units) {
      if (u.active && u.hp <= 0) this.unitPool.release(u);
    }
    this.enemies = this.enemies.filter((e) => e.active);
    this.units = this.units.filter((u) => u.active);
  }

  private checkEnd(): void {
    if (this.playerBase.destroyed) return this.end(false);
    if (this.enemyBase.destroyed) return this.end(true);
    if (this.waves.finished && this.enemies.length === 0) return this.end(true);
  }

  private end(win: boolean): void {
    this.over = true;
    this.time.delayedCall(600, () => this.scene.start('Result', { win, stageId: this.stage.id }));
  }
}
