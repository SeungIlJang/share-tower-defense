import Phaser from 'phaser';
import unitsData from '../data/units.json';
import enemiesData from '../data/enemies.json';
import stagesData from '../data/stages.json';
import type { UnitStats, EnemyStats, StageData } from '../types';
import { Unit } from '../entities/Unit';
import { Enemy } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { Base } from '../entities/Base';
import { Pool } from '../utils/pool';
import { ResourceSystem } from '../systems/resources';
import { WaveSystem } from '../systems/waves';
import { computeDamage, attackCooldown, inRange } from '../systems/combat';
import { meta, applyUpgrade } from '../systems/upgrades';
import { xpToNext, hasteMult, mimicMult, magicMult, anyUpgradable } from '../systems/skills';
import { Hud } from '../ui/Hud';
import { LevelUpOverlay } from '../ui/LevelUp';

const PROD_TYPES = ['goblin', 'wolf', 'slime', 'bat']; // 적 기지가 계속 생산하는 병력

const UNITS = unitsData as Record<string, UnitStats>;
const ENEMIES = enemiesData as Record<string, EnemyStats>;
const STAGES = stagesData as StageData[];

const LANE_Y = 500;

export class BattleScene extends Phaser.Scene {
  private stage!: StageData;
  private energy!: ResourceSystem;
  private runGold = 0;
  private readonly foodMax = 40;
  private waves!: WaveSystem;
  private hud!: Hud;
  private playerBase!: Base;
  private enemyBase!: Base;

  private unitPool!: Pool<Unit>;
  private enemyPool!: Pool<Enemy>;
  private projPool!: Pool<Projectile>;
  private units: Unit[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private over = false;
  // 레벨업 스킬(한 판 로그라이트)
  private level = 1;
  private xp = 0;
  private xpNext = xpToNext(1);
  private skills: Record<string, number> = {};
  private picking = false;
  private levelUp!: LevelUpOverlay;
  private prodTimer = 0; // 적 기지 생산 타이머
  private prodInterval = 4; // 생산 간격(초)
  private prodIdx = 0;
  private static readonly RANGED = 100; // 사거리 이 이상이면 투사체 발사

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
    this.projectiles = [];
    this.level = 1;
    this.xp = 0;
    this.xpNext = xpToNext(1);
    this.skills = {};
    this.picking = false;
    this.levelUp = new LevelUpOverlay(this);

    // 배경 + 레인
    this.add.rectangle(640, 360, 1280, 720, 0x121826).setDepth(-10);
    this.add.rectangle(640, LANE_Y + 40, 1280, 90, 0x1d2740).setDepth(-5);
    this.add.rectangle(640, LANE_Y + 2, 1280, 3, 0x33406a).setDepth(-4);

    this.playerBase = new Base(this, 90, LANE_Y - 10, this.stage.baseHp, 0x2f6fe0);
    this.enemyBase = new Base(this, 1190, LANE_Y - 10, this.stage.baseHp, 0xc0392b);

    this.energy = new ResourceSystem(40, 9, 100); // 소환 에너지(초당 9, 상한 100)
    this.runGold = 0;
    this.waves = new WaveSystem(this.stage);
    this.prodInterval = Math.max(2.5, 4.5 - this.stage.id * 0.3);
    this.prodTimer = this.prodInterval;
    this.prodIdx = 0;

    this.unitPool = new Pool<Unit>(
      () => new Unit(this),
      (u) => u.deactivate()
    );
    this.enemyPool = new Pool<Enemy>(
      () => new Enemy(this),
      (e) => e.deactivate()
    );
    this.projPool = new Pool<Projectile>(
      () => new Projectile(this),
      (p) => p.deactivate()
    );

    this.hud = new Hud(this, UNITS, (type) => this.trySpawnUnit(type));
  }

  private usedFood(): number {
    let f = 0;
    for (const u of this.units) if (u.active) f += u.pop;
    return f;
  }

  private trySpawnUnit(type: string): void {
    if (this.over) return;
    const base = UNITS[type];
    if (!base) return;
    if (this.usedFood() + base.pop > this.foodMax) return; // 인구(식량) 초과
    const energyCost = Math.round(base.cost * magicMult(this.skills.magic ?? 0)); // 마법 숙련
    if (!this.energy.spend(energyCost)) return; // 에너지 부족
    const stats = applyUpgrade(base, meta.level(type)); // 영구 강화 적용
    const u = this.unitPool.acquire();
    u.spawn(this.playerBase.x + 50, LANE_Y, stats, type, 'ally');
    u.pop = base.pop;
    this.units.push(u);
  }

  private gainXp(base: number): void {
    this.xp += Math.round(base * mimicMult(this.skills.mimic ?? 0));
    while (this.xp >= this.xpNext && !this.picking) {
      this.xp -= this.xpNext;
      this.level++;
      this.xpNext = xpToNext(this.level);
      if (anyUpgradable(this.skills)) {
        this.picking = true;
        this.levelUp.show(this.skills, (key) => {
          this.skills[key] = (this.skills[key] ?? 0) + 1;
          this.picking = false;
        });
        break; // 한 번에 한 레벨만 선택(나머지는 선택 후 이어서)
      }
    }
  }

  private linePos(): number {
    let front = this.playerBase.x;
    for (const u of this.units) if (u.active && u.x > front) front = u.x;
    const span = this.enemyBase.x - this.playerBase.x;
    return span > 0 ? (front - this.playerBase.x) / span : 0;
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
    if (this.over || this.picking) return; // 스킬 선택 중엔 전투 정지
    const dt = Math.min(0.05, deltaMs / 1000);

    this.energy.update(dt);
    for (const ev of this.waves.update(dt)) this.spawnEnemy(ev.type);

    // 적 기지가 병력을 계속 생산(기지 파괴 전까지) → 기지를 부숴야 생산이 멈춤
    if (!this.enemyBase.destroyed) {
      this.prodTimer -= dt;
      if (this.prodTimer <= 0) {
        this.prodTimer = this.prodInterval;
        this.spawnEnemy(PROD_TYPES[this.prodIdx % PROD_TYPES.length]);
        this.prodIdx++;
      }
    }

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

    // 투사체 이동/명중
    for (const p of this.projectiles) {
      if (p.active && p.update(dt)) this.projPool.release(p);
    }
    this.projectiles = this.projectiles.filter((p) => p.active);

    this.cleanupDead();
    this.hud.update({
      lv: this.level,
      gold: this.runGold,
      energy: this.energy.amount,
      energyMax: this.energy.max,
      food: this.usedFood(),
      foodMax: this.foodMax,
      linePos: this.linePos(),
    });
    this.checkEnd();
  }

  private attack(att: Unit | Enemy, def: Unit | Enemy): void {
    if (att.cooldown > 0) return;
    const dmg = computeDamage(att.stats.atk, def.stats.def);
    if (att.stats.range >= BattleScene.RANGED) {
      // 원거리: 화살(투사체) 발사 → 명중 시 데미지
      const p = this.projPool.acquire();
      const color = att.side === 'ally' ? 0xffe14d : 0xff9a4a;
      p.spawn(att.x + (att.side === 'ally' ? 14 : -14), 486, def, dmg, color);
      this.projectiles.push(p);
    } else {
      def.takeDamage(dmg); // 근접: 즉시
    }
    att.lunge(); // 공격 찌르기 모션
    let cd = attackCooldown(att.stats.atkSpeed);
    if (att.side === 'ally') cd *= hasteMult(this.skills.haste ?? 0); // 신속 오라
    att.cooldown = cd;
  }

  private puff(x: number, color: number): void {
    const y = LANE_Y - 10;
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 28 + Math.random() * 46;
      const c = this.add.circle(x, y, 3 + Math.random() * 2, color).setDepth(60);
      this.tweens.add({
        targets: c,
        x: x + Math.cos(a) * sp,
        y: y + Math.sin(a) * sp - 10,
        alpha: 0,
        duration: 380,
        onComplete: () => c.destroy(),
      });
    }
  }

  private cleanupDead(): void {
    for (const e of this.enemies) {
      if (e.active && e.hp <= 0) {
        this.runGold += e.reward;
        this.gainXp(e.reward);
        this.puff(e.x, 0xff8a6a);
        this.enemyPool.release(e);
      }
    }
    for (const u of this.units) {
      if (u.active && u.hp <= 0) {
        this.puff(u.x, 0x8ab4ff);
        this.unitPool.release(u);
      }
    }
    this.enemies = this.enemies.filter((e) => e.active);
    this.units = this.units.filter((u) => u.active);
  }

  private checkEnd(): void {
    // 승리 = 적 생산기지 파괴 / 패배 = 우리 기지 파괴
    if (this.playerBase.destroyed) return this.end(false);
    if (this.enemyBase.destroyed) return this.end(true);
  }

  private end(win: boolean): void {
    this.over = true;
    this.picking = false;
    this.levelUp.hide();
    if (win) {
      meta.addGold(this.runGold + 60 + this.stage.id * 30); // 처치 골드 + 승리 보너스(강화용)
      meta.clearStage(this.stage.id); // 다음 스테이지 해금
    }
    this.time.delayedCall(600, () => this.scene.start('Result', { win, stageId: this.stage.id }));
  }
}
