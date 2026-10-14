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
import { xpToNext, hasteMult, mimicMult, magicMult, supplyBonus, anyUpgradable } from '../systems/skills';
import { Hud } from '../ui/Hud';
import { LevelUpOverlay } from '../ui/LevelUp';
import { showRewarded } from '../systems/ads';
import { lockedUntil, UNLOCK_ALL } from '../systems/unlocks';
import {
  WEAPONS,
  WeaponCharge,
  unlockedWeapons,
  meteorTarget,
  lightningTargets,
  snipeTarget,
  METEOR_DAMAGE,
  METEOR_RADIUS,
  ARROWS_DAMAGE,
  LIGHTNING_DAMAGE,
  HEAL_UNIT_RATIO,
  HEAL_BASE_RATIO,
  SHOCKWAVE_RANGE,
  SHOCKWAVE_PUSH,
  SHOCKWAVE_DAMAGE,
  FREEZE_SEC,
  GUARD_SEC,
  BERSERK_SEC,
  BERSERK_ATK,
  BERSERK_COOLDOWN,
  SNIPE_DAMAGE,
  weaponPowerMult,
  weaponChargeMult,
  weaponDurationMult,
} from '../systems/weapons';

// 원거리 유닛: 투사체 모양 · 명중 시 범위 피해 배율(없으면 단일)
const ORB_UNITS = new Set(['mage', 'earthmage', 'darkmage', 'cannon']);
const SPLASH: Record<string, number> = { mage: 0.6, earthmage: 0.8, cannon: 0.9 };
const ORB_COLOR: Record<string, number> = { earthmage: 0xd8903a, darkmage: 0x6a2aff, cannon: 0x2a2e36 };
const CLERIC_HEAL_MULT = 2.5; // 성직자 1회 치유량 = 공격력 × 2.5

const FROZEN_TINT = 0x7cd8ff;
const GUARD_TINT = 0xb0c4ff;
const BERSERK_TINT = 0xff9a9a;

const PROD_TYPES = ['goblin', 'wolf', 'slime', 'bat']; // 적 기지가 계속 생산하는 병력
const BOSS = new Set(['ogre', 'dragon']); // 보스 타입

const UNITS = unitsData as Record<string, UnitStats>;
const ENEMIES = enemiesData as Record<string, EnemyStats>;
const STAGES = stagesData as StageData[];

const LANE_Y = 440; // 하단 HUD 2단(유닛 + 특수 무기) 공간 확보

export class BattleScene extends Phaser.Scene {
  private stage!: StageData;
  private energy!: ResourceSystem;
  private runGold = 0;
  private static readonly FOOD_BASE = 40;
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
  private paused = false; // ⏸️ 일시정지
  private reviving = false; // 부활 제안 중(업데이트 정지)
  private revivedOnce = false; // 한 판에 광고 부활 1회
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
  // 🔥 특수 무기 — 게이지(해금된 것만) + 효과 지속 시각(전투 시계 기준)
  private weapons: WeaponCharge[] = [];
  private clock = 0;
  private frozenUntil = 0;
  private guardUntil = 0;
  private berserkUntil = 0;
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
    this.paused = false;
    this.reviving = false;
    this.revivedOnce = false;
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

    this.playerBase = new Base(this, 90, LANE_Y - 10, this.stage.baseHp, 0x2f6fe0, 'base_ally');
    this.enemyBase = new Base(this, 1190, LANE_Y - 10, this.stage.baseHp, 0xc0392b, 'base_enemy');

    this.energy = new ResourceSystem(40, 9, 100); // 소환 에너지(초당 9, 상한 100)
    this.runGold = 0;
    this.battleUpg = {};
    this.waves = new WaveSystem(this.stage);
    this.prodInterval = Math.max(2.5, 4.5 - this.stage.id * 0.3);
    this.prodTimer = this.prodInterval;
    this.prodIdx = 0;
    this.beat = 0;
    this.beatDir = 1;
    this.clock = 0;
    this.frozenUntil = 0;
    this.guardUntil = 0;
    this.berserkUntil = 0;
    this.weapons = WEAPONS.slice(0, UNLOCK_ALL ? WEAPONS.length : unlockedWeapons(this.stage.id)).map((w) => new WeaponCharge(w.chargeSec * weaponChargeMult(meta.weaponLevel(w.key)))); // 🔧 영구 강화: 충전 단축

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
      (type) => this.doBattleUpgrade(type),
      (i) => this.fireWeapon(i),
      this.weapons.length,
      this.unitLocks
    );
    // 키보드 1~9 = 특수 무기
    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      const n = Number(ev.key);
      if (Number.isInteger(n) && n >= 1 && n <= 9) this.fireWeapon(n - 1);
    });

    // 보스 HP 바(상단, 보스 등장 시만)
    this.bossBarBg = this.add.rectangle(640, 60, 540, 18, 0x000000, 0.6).setDepth(90).setVisible(false);
    this.bossFill = this.add.rectangle(640 - 260, 60, 520, 12, 0xff3b3b).setOrigin(0, 0.5).setDepth(91).setVisible(false);
    this.bossText = this.add
      .text(640, 60, '', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#fff' })
      .setOrigin(0.5)
      .setDepth(92)
      .setVisible(false);

    // ⏸️ 일시정지 버튼(우상단)
    const pauseBtn = this.add
      .text(1250, 16, '⏸', { fontFamily: 'sans-serif', fontSize: '28px', color: '#cfe0ff', backgroundColor: '#1d2740', padding: { x: 10, y: 4 } })
      .setOrigin(1, 0)
      .setDepth(95)
      .setInteractive({ useHandCursor: true });
    pauseBtn.on('pointerdown', () => this.openPause());
  }

  /** ⏸️ 일시정지 오버레이 — 계속 / 음소거 / 나가기 */
  private openPause(): void {
    if (this.over || this.reviving || this.paused) return;
    this.paused = true;
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.65).setInteractive();
    const panel = this.add.rectangle(640, 360, 420, 320, 0x182238).setStrokeStyle(3, 0x3a7bff);
    const title = this.add.text(640, 250, '⏸️ 일시정지', { fontFamily: 'sans-serif', fontSize: '34px', color: '#fff' }).setOrigin(0.5);
    layer.add([dim, panel, title]);

    const resume = this.add
      .text(640, 330, '▶ 계속', { fontFamily: 'sans-serif', fontSize: '26px', color: '#fff', backgroundColor: '#2eae5a', padding: { x: 24, y: 10 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    resume.on('pointerdown', () => {
      this.paused = false;
      layer.destroy();
    });

    const muted = this.sound.mute;
    const mute = this.add
      .text(640, 395, muted ? '🔇 소리 꺼짐' : '🔊 소리 켜짐', { fontFamily: 'sans-serif', fontSize: '22px', color: '#ffd34d', backgroundColor: '#20304e', padding: { x: 20, y: 8 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    mute.on('pointerdown', () => {
      this.sound.mute = !this.sound.mute;
      mute.setText(this.sound.mute ? '🔇 소리 꺼짐' : '🔊 소리 켜짐');
    });

    const quit = this.add
      .text(640, 455, '🏳️ 나가기', { fontFamily: 'sans-serif', fontSize: '20px', color: '#8892b0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    quit.on('pointerdown', () => {
      this.paused = false;
      layer.destroy();
      this.scene.start('StageSelect');
    });
    layer.add([resume, mute, quit]);
  }

  /** 최대 인구 = 기본 40 + 보급 스킬 */
  private get foodMax(): number {
    return BattleScene.FOOD_BASE + supplyBonus(this.skills.supply ?? 0);
  }

  private usedFood(): number {
    let f = 0;
    for (const u of this.units) if (u.active) f += u.pop;
    return f;
  }

  /** 유닛별 해금 스테이지(0 = 사용 가능) — 스테이지 클리어로 6번째부터 하나씩 해금 */
  private get unitLocks(): Record<string, number> {
    return lockedUntil(Object.keys(UNITS), meta.clearedMax);
  }

  private trySpawnUnit(type: string): void {
    if (this.over || this.picking) return;
    const base = UNITS[type];
    if (!base || this.unitLocks[type]) return; // 🔒 아직 해금 안 된 유닛
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
    if (this.over || this.picking || this.paused || this.reviving) return; // 정지 상태
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

    this.clock += dt;
    for (const w of this.weapons) w.update(dt);
    const frozen = this.clock < this.frozenUntil;
    const guard = this.clock < this.guardUntil;
    const berserk = this.clock < this.berserkUntil;

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
    const allyTint = guard ? GUARD_TINT : berserk ? BERSERK_TINT : null;
    for (const u of this.units) {
      if (!u.active) continue;
      u.setStatus(allyTint);
      if (u.type === 'cleric') {
        // ✚ 성직자: 공격하지 않음 — 다친 아군 치유, 없으면 맨 앞 아군 뒤를 따라감
        if (!this.clericHeal(u, dt)) this.clericFollow(u, dt);
        continue;
      }
      const target = this.nearest(u.x, this.enemies) as Enemy | null;
      u.cooldown -= dt;
      if (target && inRange(u.x, target.x, u.stats.range)) {
        this.attack(u, target);
      } else if (target) {
        u.moveBy(u.stats.speed * dt);
      } else if (inRange(u.x, this.enemyBase.x, u.stats.range)) {
        if (u.cooldown <= 0) {
          this.enemyBase.takeDamage(computeDamage(u.stats.atk * (berserk ? BERSERK_ATK : 1), 0));
          u.cooldown = attackCooldown(u.stats.atkSpeed) * (berserk ? BERSERK_COOLDOWN : 1);
          u.lunge();
        } else {
          u.idle();
        }
      } else {
        u.moveBy(u.stats.speed * dt);
      }
    }

    // 적: 아군 추격/공격, 없으면 전진 → 플레이어 기지 공격
    for (const e of this.enemies) {
      if (!e.active) continue;
      e.setStatus(frozen ? FROZEN_TINT : null, frozen);
      if (frozen) continue; // ❄️ 빙결: 이동·공격 정지
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
          e.lunge();
        } else {
          e.idle();
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
      weapons: this.weapons.map((w) => ({ ratio: w.ratio, ready: w.ready })),
    });
    this.checkEnd();
  }

  /** 성직자 이동: 맨 앞 아군보다 50px 뒤까지만 전진(아군이 없으면 제자리) */
  private clericFollow(u: Unit, dt: number): void {
    let front = -Infinity;
    for (const o of this.units) if (o.active && o !== u && o.type !== 'cleric' && o.x > front) front = o.x;
    if (front > -Infinity && u.x < front - 50) u.moveBy(u.stats.speed * dt);
    else u.idle();
  }

  /** 성직자: 사거리 안에서 가장 많이 다친 아군을 치유. 치유 대상이 있으면 true(그 프레임은 이동·공격 안 함) */
  private clericHeal(u: Unit, dt: number): boolean {
    let best: Unit | null = null;
    for (const o of this.units) {
      if (!o.active || o === u || o.hp >= o.maxHp) continue;
      if (!inRange(u.x, o.x, u.stats.range)) continue;
      if (!best || o.hp / o.maxHp < best.hp / best.maxHp) best = o;
    }
    if (!best) return false;
    u.cooldown -= dt;
    if (u.cooldown > 0) {
      u.idle();
      return true;
    }
    best.heal(Math.round(u.stats.atk * CLERIC_HEAL_MULT));
    const fx = this.add.circle(best.x, LANE_Y - 30, 10, 0x5cff9e, 0.6).setDepth(55);
    this.tweens.add({ targets: fx, y: LANE_Y - 60, scale: 1.8, alpha: 0, duration: 450, onComplete: () => fx.destroy() });
    u.lunge();
    u.cooldown = attackCooldown(u.stats.atkSpeed) * hasteMult(this.skills.haste ?? 0);
    return true;
  }

  private attack(att: Unit | Enemy, def: Unit | Enemy): void {
    if (att.cooldown > 0) {
      att.idle(); // 사거리 안 쿨다운 대기
      return;
    }
    const berserk = att.side === 'ally' && this.clock < this.berserkUntil; // ⚔️ 광폭
    const dmg = computeDamage(att.stats.atk * (berserk ? BERSERK_ATK : 1), def.stats.def);
    if (att.stats.range >= BattleScene.RANGED) {
      // 원거리: 궁수=화살(직선·빠름), 마법사=마법 구슬(느림·명중 시 광역)
      const p = this.projPool.acquire();
      const splashMul = SPLASH[att.type];
      const onHit = splashMul
        ? (x: number, d: number) => this.splash(x, Math.round(d * splashMul), att.side)
        : undefined;
      p.spawn(att.x + (att.side === 'ally' ? 14 : -14), LANE_Y - 14, def, dmg, ORB_UNITS.has(att.type) ? 'orb' : 'arrow', onHit, ORB_COLOR[att.type]);
      this.projectiles.push(p);
    } else {
      // 근접: 즉시 — 🛡️ 수호 중인 아군은 피해 없음
      if (!(def.side === 'ally' && this.clock < this.guardUntil)) def.takeDamage(dmg);
    }
    att.lunge(); // 공격 찌르기 모션
    let cd = attackCooldown(att.stats.atkSpeed);
    if (att.side === 'ally') cd *= hasteMult(this.skills.haste ?? 0); // 신속 오라
    if (berserk) cd *= BERSERK_COOLDOWN;
    att.cooldown = cd;
  }

  /** 🔥 특수 무기 발사 — 게이지가 가득 찬 해금 무기만 */
  private fireWeapon(i: number): void {
    if (this.over || this.picking || this.paused || this.reviving) return;
    const charge = this.weapons[i];
    if (!charge?.ready) return;
    const def = WEAPONS[i];
    const live = this.enemies.filter((e) => e.active);
    // 대상이 필요한 무기는 적이 없으면 게이지를 쓰지 않음
    const needsEnemy = ['meteor', 'arrows', 'lightning', 'shockwave', 'snipe'].includes(def.key);
    if (needsEnemy && live.length === 0) return;
    charge.fire();
    this.banner(`${def.icon} ${def.name}!`, def.color);
    // 🔧 영구 강화: 위력(피해·회복·밀어내기) / 지속시간
    const lv = meta.weaponLevel(def.key);
    const P = weaponPowerMult(lv);
    const D = weaponDurationMult(lv);
    const pw = (v: number): number => Math.round(v * P);

    switch (def.key) {
      case 'meteor': {
        const x = meteorTarget(live.map((e) => e.x)) ?? live[0].x;
        const rock = this.add.circle(x - 120, -40, 22, 0xff7a3c).setStrokeStyle(4, 0xffd34d).setDepth(80);
        this.tweens.add({
          targets: rock,
          x,
          y: LANE_Y - 10,
          duration: 380,
          ease: 'Quad.easeIn',
          onComplete: () => {
            rock.destroy();
            for (const e of this.enemies) if (e.active && Math.abs(e.x - x) <= METEOR_RADIUS) e.takeDamage(pw(METEOR_DAMAGE));
            this.burst(x, 0xff7a3c, METEOR_RADIUS);
            this.cameras.main.shake(250, 0.01);
          },
        });
        break;
      }
      case 'arrows':
        for (const e of live) {
          const a = this.add.rectangle(e.x - 30, LANE_Y - 260, 4, 26, 0xc8e06a).setAngle(-20).setDepth(80);
          this.tweens.add({ targets: a, x: e.x, y: LANE_Y - 20, duration: 260 + Math.random() * 120, onComplete: () => a.destroy() });
        }
        this.time.delayedCall(330, () => {
          for (const e of live) if (e.active) e.takeDamage(pw(ARROWS_DAMAGE));
        });
        break;
      case 'lightning':
        for (const idx of lightningTargets(live.map((e) => e.x))) {
          const e = live[idx];
          const bolt = this.add.rectangle(e.x, LANE_Y - 200, 6, 400, 0xfff6b0).setDepth(80);
          this.tweens.add({ targets: bolt, alpha: 0, scaleX: 3, duration: 260, onComplete: () => bolt.destroy() });
          e.takeDamage(pw(LIGHTNING_DAMAGE));
        }
        this.cameras.main.flash(120, 255, 240, 160);
        break;
      case 'heal':
        for (const u of this.units) {
          if (!u.active) continue;
          u.heal(Math.round(u.maxHp * Math.min(1, HEAL_UNIT_RATIO * P)));
          this.burst(u.x, 0x5cff9e, 24);
        }
        this.playerBase.heal(Math.round(this.playerBase.maxHp * HEAL_BASE_RATIO * P));
        this.burst(this.playerBase.x, 0x5cff9e, 50);
        break;
      case 'shockwave': {
        const front = Math.min(...live.map((e) => e.x));
        for (const e of live) {
          if (e.x - front > SHOCKWAVE_RANGE) continue;
          e.moveBy(Math.min(pw(SHOCKWAVE_PUSH), Math.max(0, this.enemyBase.x - 50 - e.x)));
          e.takeDamage(pw(SHOCKWAVE_DAMAGE));
        }
        this.burst(front, 0xffa94d, SHOCKWAVE_RANGE / 2);
        this.cameras.main.shake(200, 0.008);
        break;
      }
      case 'freeze':
        this.frozenUntil = this.clock + FREEZE_SEC * D;
        this.cameras.main.flash(200, 120, 200, 255);
        break;
      case 'guard':
        this.guardUntil = this.clock + GUARD_SEC * D;
        for (const u of this.units) if (u.active) this.burst(u.x, 0x9ab4ff, 26);
        break;
      case 'berserk':
        this.berserkUntil = this.clock + BERSERK_SEC * D;
        for (const u of this.units) if (u.active) this.burst(u.x, 0xff5a6e, 26);
        break;
      case 'snipe': {
        const t = live[snipeTarget(live.map((e) => e.hp))];
        const mark = this.add.circle(t.x, LANE_Y - 20, 40).setStrokeStyle(3, 0xd58cff).setDepth(80);
        this.tweens.add({
          targets: mark,
          scale: 0.3,
          duration: 300,
          onComplete: () => {
            mark.destroy();
            if (t.active) t.takeDamage(pw(SNIPE_DAMAGE));
            this.burst(t.x, 0xd58cff, 30);
          },
        });
        break;
      }
    }
  }

  /** 무기 이름 배너 */
  private banner(text: string, color: number): void {
    const t = this.add
      .text(640, 230, text, {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: `#${color.toString(16).padStart(6, '0')}`,
        stroke: '#000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(96);
    this.tweens.add({ targets: t, y: 200, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  /** 원형 폭발/효과 링 */
  private burst(x: number, color: number, radius: number): void {
    const c = this.add.circle(x, LANE_Y - 10, Math.max(8, radius / 3), color, 0.45).setDepth(75);
    this.tweens.add({ targets: c, scale: 3, alpha: 0, duration: 380, onComplete: () => c.destroy() });
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
        e.playDeath();
        this.puff(e.x, 0xff8a6a);
        this.enemyPool.release(e);
      }
    }
    for (const u of this.units) {
      if (u.active && u.hp <= 0) {
        u.playDeath();
        this.puff(u.x, 0x8ab4ff);
        this.unitPool.release(u);
      }
    }
    this.enemies = this.enemies.filter((e) => e.active);
    this.units = this.units.filter((u) => u.active);
  }

  private checkEnd(): void {
    // 승리 = 적 생산기지 파괴 / 패배 = 우리 기지 파괴
    if (this.enemyBase.destroyed) return this.end(true);
    if (this.playerBase.destroyed) {
      if (!this.revivedOnce) {
        this.offerRevive(); // 광고 보고 부활 1회 제안
        return;
      }
      return this.end(false);
    }
  }

  /** 💔 기지 파괴 → 광고 보고 부활 제안(한 판 1회) */
  private offerRevive(): void {
    if (this.reviving || this.revivedOnce) return;
    this.reviving = true; // 업데이트 정지
    const layer = this.add.container(0, 0).setDepth(200);
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setInteractive();
    const panel = this.add.rectangle(640, 360, 480, 340, 0x241824).setStrokeStyle(3, 0xff5a6e);
    const title = this.add.text(640, 250, '💔 기지 파괴!', { fontFamily: 'sans-serif', fontSize: '40px', color: '#ff5a6e' }).setOrigin(0.5);
    const sub = this.add.text(640, 310, '광고를 보고 기지를 부활시킬까요?', { fontFamily: 'sans-serif', fontSize: '20px', color: '#cfd6e6' }).setOrigin(0.5);
    layer.add([dim, panel, title, sub]);

    const watch = this.add
      .text(640, 380, '📺 광고 보고 부활', { fontFamily: 'sans-serif', fontSize: '26px', color: '#fff', backgroundColor: '#2eae5a', padding: { x: 24, y: 12 } })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    watch.on('pointerdown', () => {
      watch.disableInteractive().setText('⏳ 광고…');
      void showRewarded().then((ok) => {
        layer.destroy();
        if (ok) this.doRevive();
        else {
          this.reviving = false;
          this.end(false);
        }
      });
    });

    const give = this.add
      .text(640, 450, '포기', { fontFamily: 'sans-serif', fontSize: '20px', color: '#8892b0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    give.on('pointerdown', () => {
      layer.destroy();
      this.reviving = false;
      this.end(false);
    });
    layer.add([watch, give]);
  }

  /** 부활 실행 — 기지 HP 복구 + 전장 적 밀어내기 */
  private doRevive(): void {
    this.revivedOnce = true;
    this.reviving = false;
    this.playerBase.heal(Math.round(this.playerBase.maxHp * 0.6));
    // 기지 근처 적들을 적 진영 쪽으로 밀어내 숨 돌릴 틈 제공
    for (const e of this.enemies) {
      if (e.active) e.moveBy(260);
    }
    this.energy.add(60);
    const t = this.add
      .text(640, 300, '✨ 부활! ✨', { fontFamily: 'sans-serif', fontSize: '48px', fontStyle: 'bold', color: '#ffe14d' })
      .setOrigin(0.5)
      .setDepth(120);
    this.tweens.add({ targets: t, y: 240, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  private end(win: boolean): void {
    this.over = true;
    this.picking = false;
    this.levelUp.hide();
    const earned = win ? this.runGold + 60 + this.stage.id * 30 : 0;
    if (win) {
      meta.addGold(earned); // 처치 골드 + 승리 보너스(강화용)
      meta.clearStage(this.stage.id); // 다음 스테이지 해금
    }
    this.time.delayedCall(600, () => this.scene.start('Result', { win, stageId: this.stage.id, earned }));
  }
}
