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
const BOSS = new Set(['ogre']); // 보스 타입

const UNITS = unitsData as Record<string, UnitStats>;
const ENEMIES = enemiesData as Record<string, EnemyStats>;
const STAGES = stagesData as StageData[];

const LANE_Y = 500;

export class BattleScene extends Phaser.Scene {
  private stage!: StageData;
  private energy!: ResourceSystem;
  private runGold = 0;
  private readonly foodMax = 40;
  private battleUpg: Record<string, number> = {}; // 전장 실시간 강화 레벨
  private waves!: WaveSystem;
  private hud!: Hud;
  private playerBase!: Base;
  private enemyBase!: Base;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossFill!: Phaser.GameObjects.Rectangle;
  private bossText!: Phaser.GameObjects.Text;

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
  // ⏱️ 리듬 소환
  private beat = 0;
  private beatDir = 1;
  private static readonly BEAT_SPEED = 0.85;
  private static readonly PERFECT_WIN = 0.08;
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
    this.battleUpg = {};
    this.waves = new WaveSystem(this.stage);
    this.prodInterval = Math.max(2.5, 4.5 - this.stage.id * 0.3);
    this.prodTimer = this.prodInterval;
    this.prodIdx = 0;
    this.beat = 0;
    this.beatDir = 1;

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

    this.hud = new Hud(
      this,
      UNITS,
      (type) => this.trySpawnUnit(type),
      (type) => this.doBattleUpgrade(type)
    );

    // 보스 HP 바(상단, 보스 등장 시만)
    this.bossBarBg = this.add.rectangle(640, 60, 540, 18, 0x000000, 0.6).setDepth(90).setVisible(false);
    this.bossFill = this.add.rectangle(640 - 260, 60, 520, 12, 0xff3b3b).setOrigin(0, 0.5).setDepth(91).setVisible(false);
    this.bossText = this.add
      .text(640, 60, '', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff' })
      .setOrigin(0.5)
      .setDepth(92)
      .setVisible(false);
  }

  private usedFood(): number {
    let f = 0;
    for (const u of this.units) if (u.active) f += u.pop;
    return f;
  }

  private trySpawnUnit(type: string): void {
    if (this.over || this.picking) return;
    const base = UNITS[type];
    if (!base) return;
    if (this.usedFood() + base.pop > this.foodMax) {
      this.hud.deny(type, 'food'); // 인구 초과 안내
      return;
    }
    const energyCost = Math.round(base.cost * magicMult(this.skills.magic ?? 0)); // 마법 숙련
    if (!this.energy.spend(energyCost)) {
      this.hud.deny(type, 'energy'); // 에너지 부족 안내
      return;
    }
    const m = applyUpgrade(base, meta.level(type)); // 영구 강화 적용
    const perfect = Math.abs(this.beat - 0.5) <= BattleScene.PERFECT_WIN; // ⏱️ 타이밍 명중
    const pm = perfect ? 1.3 : 1;
    const bm = 1 + (this.battleUpg[type] ?? 0) * 0.2; // 🛠️ 전장 강화
    const stats = { ...m, hp: Math.round(m.hp * bm * pm), atk: Math.round(m.atk * bm * pm) };
    const u = this.unitPool.acquire();
    u.spawn(this.playerBase.x + 50, LANE_Y, stats, type, 'ally');
    u.pop = base.pop;
    this.units.push(u);
    if (perfect) {
      const t = this.add
        .text(this.playerBase.x + 60, LANE_Y - 70, 'PERFECT! ⚡', {
          fontFamily: 'sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          color: '#ffe14d',
        })
        .setOrigin(0.5)
        .setDepth(70);
      this.tweens.add({ targets: t, y: LANE_Y - 112, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    }
    this.hud.hideHint(); // 첫 소환하면 가이드 제거
  }

  private upgCost(type: string): number {
    return 40 + (this.battleUpg[type] ?? 0) * 30;
  }

  private doBattleUpgrade(type: string): void {
    if (this.over || this.picking) return;
    const cost = this.upgCost(type);
    if (this.runGold < cost) return;
    this.runGold -= cost;
    const old = 1 + (this.battleUpg[type] ?? 0) * 0.2;
    this.battleUpg[type] = (this.battleUpg[type] ?? 0) + 1;
    const neu = 1 + this.battleUpg[type] * 0.2;
    const r = neu / old;
    // 이미 깔린 같은 종류 유닛도 즉시 강화
    for (const u of this.units) {
      if (u.active && u.type === type) {
        u.maxHp = Math.round(u.maxHp * r);
        u.hp = Math.round(u.hp * r);
        u.stats = { ...u.stats, atk: Math.round(u.stats.atk * r) };
      }
    }
    const t = this.add
      .text(this.playerBase.x + 60, LANE_Y - 70, '🛠️ 강화!', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#8affb0' })
      .setOrigin(0.5)
      .setDepth(70);
    this.tweens.add({ targets: t, y: LANE_Y - 110, alpha: 0, duration: 650, onComplete: () => t.destroy() });
  }

  private upgMap(): Record<string, { lv: number; cost: number; afford: boolean }> {
    const m: Record<string, { lv: number; cost: number; afford: boolean }> = {};
    for (const k of Object.keys(UNITS)) {
      const lv = this.battleUpg[k] ?? 0;
      const cost = this.upgCost(k);
      m[k] = { lv: lv + 1, cost, afford: this.runGold >= cost };
    }
    return m;
  }

  private affordMap(): Record<string, boolean> {
    const m: Record<string, boolean> = {};
    const food = this.usedFood();
    for (const k of Object.keys(UNITS)) {
      const u = UNITS[k];
      const ec = Math.round(u.cost * magicMult(this.skills.magic ?? 0));
      m[k] = this.energy.amount >= ec && food + u.pop <= this.foodMax;
    }
    return m;
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
    if (BOSS.has(type)) {
      this.cameras.main.shake(300, 0.012);
      const t = this.add
        .text(640, 210, '👑 보스 등장!', { fontFamily: 'sans-serif', fontSize: '44px', fontStyle: 'bold', color: '#ff5a6e' })
        .setOrigin(0.5)
        .setDepth(95);
      this.tweens.add({ targets: t, y: 170, alpha: 0, duration: 1600, onComplete: () => t.destroy() });
    }
  }

  private updateBossBar(): void {
    const boss = this.enemies.find((e) => e.active && BOSS.has(e.type));
    if (boss) {
      this.bossBarBg.setVisible(true);
      this.bossFill.setVisible(true).setSize(520 * Math.max(0, boss.hp / boss.maxHp), 12);
      this.bossText.setVisible(true).setText(`👑 ${boss.stats.name}  ${Math.max(0, Math.ceil(boss.hp))}/${boss.maxHp}`);
    } else {
      this.bossBarBg.setVisible(false);
      this.bossFill.setVisible(false);
      this.bossText.setVisible(false);
    }
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

    // ⏱️ 리듬 바 진행(0↔1 핑퐁)
    this.beat += this.beatDir * dt * BattleScene.BEAT_SPEED;
    if (this.beat >= 1) {
      this.beat = 1;
      this.beatDir = -1;
    } else if (this.beat <= 0) {
      this.beat = 0;
      this.beatDir = 1;
    }

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
    this.updateBossBar();
    this.hud.update({
      lv: this.level,
      gold: this.runGold,
      energy: this.energy.amount,
      energyMax: this.energy.max,
      food: this.usedFood(),
      foodMax: this.foodMax,
      linePos: this.linePos(),
      afford: this.affordMap(),
      beat: this.beat,
      perfectWin: BattleScene.PERFECT_WIN,
      upg: this.upgMap(),
    });
    this.checkEnd();
  }

  private attack(att: Unit | Enemy, def: Unit | Enemy): void {
    if (att.cooldown > 0) return;
    const dmg = computeDamage(att.stats.atk, def.stats.def);
    if (att.stats.range >= BattleScene.RANGED) {
      // 원거리: 궁수=화살(직선·빠름), 마법사=마법 구슬(느림·명중 시 광역)
      const p = this.projPool.acquire();
      const isMage = att.type === 'mage';
      const onHit = isMage
        ? (x: number, d: number) => this.splash(x, Math.round(d * 0.6), att.side)
        : undefined;
      p.spawn(att.x + (att.side === 'ally' ? 14 : -14), 486, def, dmg, isMage ? 'orb' : 'arrow', onHit);
      this.projectiles.push(p);
    } else {
      def.takeDamage(dmg); // 근접: 즉시
    }
    att.lunge(); // 공격 찌르기 모션
    let cd = attackCooldown(att.stats.atkSpeed);
    if (att.side === 'ally') cd *= hasteMult(this.skills.haste ?? 0); // 신속 오라
    att.cooldown = cd;
  }

  /** 마법 구슬 광역 피해 — 명중 지점 주변 적(또는 아군)에게 추가 피해 + 폭발 이펙트 */
  private splash(x: number, dmg: number, side: 'ally' | 'enemy'): void {
    const list = side === 'ally' ? this.enemies : this.units;
    for (const o of list) {
      if (o.active && Math.abs(o.x - x) <= 64) o.takeDamage(dmg);
    }
    const fx = this.add.circle(x, LANE_Y - 10, 14, 0xb98cff, 0.5).setDepth(55);
    this.tweens.add({ targets: fx, scale: 3.4, alpha: 0, duration: 300, onComplete: () => fx.destroy() });
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
