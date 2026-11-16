import Phaser from 'phaser';
import enemiesData from '../data/enemies.json';
import unitsData from '../data/units.json';
import type { EnemyStats, UnitStats } from '../types';
import { meta } from '../systems/upgrades';
import { CODEX_MILESTONES, claimableMilestone, codexStars, discoverReward } from '../systems/codex';
import { KIND_INFO, UNIT_COUNTER, enemyKind } from '../systems/counters';
import { isBoss } from '../systems/bosses';
import { sfx } from '../systems/sound';
import { cuteButton, cuteTitle, drawSky } from '../ui/cute';
import { fitSprite } from '../ui/fitSprite';
import { enemyPortrait } from '../ui/enemyArt';
import { VIEW_W } from '../systems/view';
import { allEnemyTypes, preloadNeeded } from '../systems/assetLoad';
import { spriteOf, textureKey } from '../systems/sprites';
import { GRADE_INFO, UNIT_TIERS, evolvedKey, gradeOf, unitPreloadKeys } from '../systems/evolution';
import { UNIT_SKILLS, type SkillKind } from '../systems/unitSkills';
import { TOTEMS } from '../systems/totems';
import { groupInfo, unitGroup } from '../systems/unitGroups';
import { tr } from '../systems/i18n';

const ENEMIES = enemiesData as Record<string, EnemyStats>;
const UNITS = unitsData as Record<string, UnitStats>;

const ABILITY: Record<string, string> = {
  explode: tr('💥 죽을 때 폭발'),
  heal: tr('💚 주변 적 회복'),
  lifesteal: tr('🩸 흡혈'),
  rage: tr('😡 체력이 낮으면 광폭'),
  split: tr('🟢 죽으면 분열'),
  summon: tr('💀 부하 소환'),
};

/** ✨ 유닛 스킬 종류 설명 */
const SKILL_KIND: Record<SkillKind, string> = {
  aoe: tr('주변 적에게 범위 피해'),
  pierce: tr('앞쪽 일직선 적 여러 마리 관통'),
  single: tr('적 하나에게 큰 피해'),
  heal: tr('주변 아군 회복'),
  guard: tr('범위 피해 + 잠깐 받는 피해 절반'),
  slow: tr('범위 피해 + 적 이동 느려짐'),
  pull: tr('범위 피해 + 적을 한곳으로 끌어당김'),
  push: tr('피해 + 적을 뒤로 밀어냄'),
  dash: tr('앞으로 돌진하며 피해'),
};

type CodexTab = 'enemy' | 'unit';

/** 📖 도감 — 👾 몬스터(잡은 적은 그림·이름, 못 잡은 적은 그림자 · 발견/수집 보상) · 🛡️ 유닛(능력치·스킬·상성·진화) */
export class CodexScene extends Phaser.Scene {
  private static tab: CodexTab = 'enemy';
  private layer!: Phaser.GameObjects.Container;
  private title!: Phaser.GameObjects.Text;

  constructor() {
    super('Codex');
  }

  preload(): void {
    const units = unitPreloadKeys(Object.keys(UNITS), (k) => !!spriteOf(k), (u) => meta.tier(u), () => null);
    preloadNeeded(this, [...allEnemyTypes(), ...units]);
  }

  create(): void {
    drawSky(this, { stars: 10 });
    this.title = cuteTitle(this, 640, 40, '', 40);
    this.layer = this.add.container(0, 0);
    this.render();
    cuteButton(this, 640, 676, 240, 54, tr('🏠 홈으로'), 0x4a8bff, 0x2a5fd0, '22px', () => this.scene.start('Menu'));
  }

  private render(): void {
    this.layer.removeAll(true);
    const unitTab = CodexScene.tab === 'unit';
    this.title.setText(unitTab ? tr('📖 유닛 도감') : tr('📖 몬스터 도감'));
    // 👾 몬스터 · 🛡️ 유닛 탭(왼쪽 위)
    const tabs: [CodexTab, string, number][] = [
      ['enemy', tr('👾 몬스터'), 110],
      ['unit', tr('🛡️ 유닛'), 260],
    ];
    tabs.forEach(([key, label, x]) => {
      const on = CodexScene.tab === key;
      const t = this.add
        .text(x, 40, label, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: on ? '#ffffff' : '#3a4a7a', backgroundColor: on ? '#4a8bff' : '#ffffffcc', padding: { x: 14, y: 8 } })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => {
        if (on) return;
        sfx(this, 'click');
        CodexScene.tab = key;
        this.render();
      });
      this.layer.add(t);
    });
    if (unitTab) {
      this.renderUnits();
      return;
    }
    const keys = Object.keys(ENEMIES);
    const found = meta.codexFound;
    // 수집 진행 + 다음 단계 보상
    const step = CODEX_MILESTONES.find((_m, i) => !meta.codexSteps.includes(i));
    const can = claimableMilestone(found, meta.codexSteps);
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.25).fillRoundedRect(300, 82, 480, 22, 11);
    bar.fillStyle(0x5cd88a, 1).fillRoundedRect(300, 82, Math.max(22, 480 * Math.min(1, found / keys.length)), 22, 11);
    this.layer.add([
      bar,
      this.add.text(540, 93, tr('발견 {0} / {1}', found, keys.length), { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5),
    ]);
    if (step) {
      const label = can >= 0 ? tr('🎁 {0}마리 보상 받기!', step.need) : tr('🎁 {0}마리: 🪙{1} + 🃏전 유닛 {2}', step.need, step.gold, step.shards);
      const t = this.add
        .text(800, 93, label, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff', backgroundColor: can >= 0 ? '#2fa25a' : '#4a5578', padding: { x: 10, y: 5 } })
        .setOrigin(0, 0.5);
      if (can >= 0) {
        t.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          const r = meta.claimCodexStep(Object.keys(UNITS).filter((k) => meta.ownsUnit(k)));
          if (!r) return;
          sfx(this, 'win');
          this.toast(tr('🎉 🪙 +{0} · 🃏 모든 유닛 조각 +{1}', r.gold, r.shards));
          this.render();
        });
        this.tweens.add({ targets: t, scale: 1.08, duration: 400, yoyo: true, repeat: -1 });
      }
      this.layer.add(t);
    }

    keys.forEach((k, i) => {
      const x = 122 + (i % 8) * 148;
      const y = 172 + Math.floor(i / 8) * 96;
      const kills = meta.kills[k] ?? 0;
      const seen = kills > 0;
      const boss = isBoss(k);
      const unclaimed = seen && !meta.codexClaimed.includes(k);
      const card = this.add.rectangle(x, y, 140, 88, seen ? 0xffffff : 0x2a3348, seen ? 0.94 : 0.75).setStrokeStyle(3, unclaimed ? 0xffc93a : boss ? 0xff6a6a : seen ? 0x9ab0d8 : 0x3a4560);
      const parts: Phaser.GameObjects.GameObject[] = [card];
      const art = enemyPortrait(this, k, x, y - 10, 70, 56);
      if (art) {
        if (!seen) art.setTint(0x10141f).setAlpha(0.85); // 그림자
        parts.push(art);
      } else parts.push(this.add.text(x, y - 10, seen ? '👾' : '❓', { fontSize: '34px', padding: { top: 8, bottom: 2 } }).setOrigin(0.5));
      parts.push(
        this.add.text(x, y + 28, seen ? ENEMIES[k].name : '???', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: seen ? (boss ? '#d8323a' : '#2a3350') : '#8a96b8' }).setOrigin(0.5)
      );
      if (seen) parts.push(this.add.text(x - 64, y - 40, '★'.repeat(codexStars(kills)), { fontSize: '13px', color: '#ffb02e' }).setOrigin(0, 0));
      const kind = enemyKind(k);
      if (seen && kind) parts.push(this.add.text(x + 60, y - 30, KIND_INFO[kind].icon, { fontSize: '16px', padding: { top: 6, bottom: 2 } }).setOrigin(1, 0.5));
      if (unclaimed) {
        const gift = this.add.text(x + 52, y + 4, '🎁', { fontSize: '24px', padding: { top: 8, bottom: 2 } }).setOrigin(0.5);
        this.tweens.add({ targets: gift, angle: { from: -12, to: 12 }, duration: 300, yoyo: true, repeat: -1 });
        parts.push(gift);
      }
      card.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        if (unclaimed) {
          const g = meta.claimDiscover(k);
          sfx(this, 'coin', 1.4);
          this.toast(tr('📖 {0} 발견 보상 🪙 +{1}', ENEMIES[k].name, g));
          this.render();
        } else this.detail(k);
      });
      this.layer.add(parts);
    });
  }

  /** 🛡️ 유닛 초상 — 지금 진화 단계 그림(없으면 기본) 첫 프레임 */
  private unitArt(k: string, x: number, y: number, maxW: number, maxH: number): Phaser.GameObjects.Sprite | null {
    const has = (key: string): boolean => !!spriteOf(key) && this.textures.exists(textureKey(key));
    const look = (meta.ownsUnit(k) ? evolvedKey(k, meta.tier(k), false, has) : null) ?? k;
    const d = spriteOf(look);
    if (!d || !has(look)) return null;
    const spr = this.add.sprite(x, y, textureKey(look), d.anims.idle?.frames[0] ?? 0);
    fitSprite(spr, x, y, maxW, maxH); // 프레임 여백 말고 실제 그림 크기로 꽉 차게
    return spr;
  }

  /** 🛡️ 유닛 도감 — 15종 카드(보유하면 그림·레벨·별, 아니면 그림자) */
  private renderUnits(): void {
    const keys = Object.keys(UNITS);
    const owned = keys.filter((k) => meta.ownsUnit(k)).length;
    const bar = this.add.graphics();
    bar.fillStyle(0x000000, 0.25).fillRoundedRect(400, 82, 480, 22, 11);
    bar.fillStyle(0x4a8bff, 1).fillRoundedRect(400, 82, Math.max(22, 480 * Math.min(1, owned / keys.length)), 22, 11);
    this.layer.add([
      bar,
      this.add.text(640, 93, tr('보유 {0} / {1}', owned, keys.length), { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5),
    ]);
    keys.forEach((k, i) => {
      const x = 640 + ((i % 5) - 2) * 232;
      const y = 196 + Math.floor(i / 5) * 160;
      const have = meta.ownsUnit(k);
      const grade = GRADE_INFO[gradeOf(k)];
      const grp = groupInfo(unitGroup(UNITS[k]));
      const card = this.add.rectangle(x, y, 218, 148, have ? 0xffffff : 0x2a3348, have ? 0.94 : 0.75).setStrokeStyle(3, have ? grade.color : 0x3a4560);
      const parts: Phaser.GameObjects.GameObject[] = [card];
      const art = this.unitArt(k, x, y - 6, 150, 86);
      if (art) {
        if (!have) art.setTint(0x10141f).setAlpha(0.85); // 그림자
        parts.push(art);
      } else parts.push(this.add.text(x, y - 6, have ? '🛡️' : '❓', { fontSize: '40px', padding: { top: 8, bottom: 2 } }).setOrigin(0.5));
      parts.push(
        this.add.text(x, y + 53, UNITS[k].name, { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: have ? '#2a3350' : '#8a96b8' }).setOrigin(0.5),
        this.add.text(x - 100, y - 60, grp.icon, { fontSize: '18px', padding: { top: 6, bottom: 2 } }).setOrigin(0, 0.5),
        this.add.text(x + 100, y - 60, have ? `Lv${meta.level(k)} ★${meta.tier(k) + 1}` : '🔒', { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: have ? '#c08a20' : '#8a96b8' }).setOrigin(1, 0.5)
      );
      card.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.unitDetail(k));
      this.layer.add(parts);
    });
  }

  /** 🛡️ 유닛 자세히 — 기본 능력치 · 스킬 · 강한 상대 · 진화 단계 */
  private unitDetail(k: string): void {
    const u = UNITS[k];
    const have = meta.ownsUnit(k);
    const grade = GRADE_INFO[gradeOf(k)];
    const d = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.55).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.97).fillRoundedRect(300, 110, 680, 500, 28);
    g.lineStyle(4, grade.color, 1).strokeRoundedRect(300, 110, 680, 500, 28);
    d.add([dim, g]);
    const art = this.unitArt(k, 430, 262, 210, 200);
    if (art) {
      if (!have) art.setTint(0x10141f).setAlpha(0.85);
      d.add(art);
    }
    const status = have ? tr('Lv{0} · ★{1} {2}', meta.level(k), meta.tier(k) + 1, UNIT_TIERS[meta.tier(k)].name) : tr('🔒 아직 없어요\n강화 화면에서 영입!');
    d.add(this.add.text(430, 390, status, { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: have ? '#c08a20' : '#8a96b8', align: 'center' }).setOrigin(0.5, 0));
    const sk = UNIT_SKILLS[k];
    const totem = TOTEMS[k];
    const kind = UNIT_COUNTER[k];
    const lines = [
      `${u.name}  ·  ${grade.name}  ·  ${groupInfo(unitGroup(u)).label}`,
      `❤️ ${u.hp}   ⚔️ ${u.atk}   🛡️ ${u.def}`,
      u.speed > 0 ? tr('🎯 사거리 {0}   🏃 이동 {1}', u.range, u.speed) : tr('🎯 사거리 {0}   📍 그 자리에 설치', u.range),
      tr('⚡ 소환 {0}   🍖 인구 {1}', u.cost, u.pop),
      sk ? tr('✨ {0} — {1}', sk.name, SKILL_KIND[sk.kind]) : totem ? `✨ ${totem.desc}` : '',
      kind ? tr('💪 강한 상대: {0} {1} (피해 ×1.5)', KIND_INFO[kind].icon, KIND_INFO[kind].name) : tr('💪 강한 상대: 없음 (지원형)'),
    ].filter(Boolean);
    d.add(this.add.text(560, 140, lines.join('\n'), { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#2a3350', lineSpacing: 10, wordWrap: { width: 400 } }).setOrigin(0, 0));
    const evo = UNIT_TIERS.slice(0, 5)
      .map((t, i) => (i === 0 ? `★1 ${t.name}` : `★${t.stars} ${t.name}(Lv${t.min})`))
      .join(' → ');
    d.add(this.add.text(640, 482, tr('⭐ 진화: {0} → 🌟 초월', evo), { fontFamily: 'sans-serif', fontSize: '14px', fontStyle: 'bold', color: '#7a4ad8', align: 'center', wordWrap: { width: 620 } }).setOrigin(0.5));
    d.add(this.add.text(640, 520, tr('※ 능력치는 Lv0 기본값 — 강화·진화하면 올라가요'), { fontFamily: 'sans-serif', fontSize: '13px', color: '#8a96b8' }).setOrigin(0.5));
    const close = this.add.text(640, 568, tr('닫기'), { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#fff', backgroundColor: '#4a8bff', padding: { x: 26, y: 8 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    d.add(close);
    const shut = (): void => d.destroy();
    close.on('pointerdown', shut);
    dim.on('pointerdown', shut);
  }

  /** 적 자세히 — 능력치 · 종류 · 상대하기 좋은 유닛 */
  private detail(k: string): void {
    const seen = (meta.kills[k] ?? 0) > 0;
    const e = ENEMIES[k];
    const d = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(640, 360, VIEW_W, 720, 0x000000, 0.55).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.97).fillRoundedRect(390, 170, 500, 380, 28);
    g.lineStyle(4, isBoss(k) ? 0xff6a6a : 0x6a8ad8, 1).strokeRoundedRect(390, 170, 500, 380, 28);
    d.add([dim, g]);
    if (!seen) {
      d.add(this.add.text(640, 340, tr('❓ 아직 못 잡은 적이에요\n\n잡으면 도감에 등록되고\n발견 보상 🪙{0}을 받아요', discoverReward(k)), { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#4a5a7a', align: 'center' }).setOrigin(0.5));
    } else {
      const art = enemyPortrait(this, k, 520, 290, 160, 140);
      if (art) d.add(art);
      const kind = enemyKind(k);
      const counters = kind ? Object.keys(UNITS).filter((u) => UNIT_COUNTER[u] === kind).map((u) => UNITS[u].name) : [];
      const lines = [
        `${isBoss(k) ? '👑 ' : ''}${e.name}`,
        `❤️ ${e.hp}   ⚔️ ${e.atk}   🛡️ ${e.def}`,
        tr('🏃 이동 {0}   🎯 사거리 {1}', e.speed, e.range),
        kind ? `${KIND_INFO[kind].icon} ${KIND_INFO[kind].name}` : '',
        e.ability ? ABILITY[e.ability] ?? '' : '',
        tr('🗡️ 처치 {0}  {1}', meta.kills[k], '★'.repeat(codexStars(meta.kills[k] ?? 0))),
      ].filter(Boolean);
      d.add(this.add.text(620, 196, lines.join('\n'), { fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#2a3350', lineSpacing: 10 }).setOrigin(0, 0));
      if (counters.length) d.add(this.add.text(640, 430, tr('🎯 상대하기 좋은 유닛: {0} (피해 ×1.5)', counters.join(' · ')), { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#2fa25a' }).setOrigin(0.5));
      d.add(this.add.text(640, 462, tr('★ 처치 1 · ★★ 50 · ★★★ 300'), { fontFamily: 'sans-serif', fontSize: '14px', color: '#8a96b8' }).setOrigin(0.5));
    }
    const close = this.add.text(640, 512, tr('닫기'), { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#fff', backgroundColor: '#4a8bff', padding: { x: 26, y: 8 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    d.add(close);
    const shut = (): void => {
      d.destroy();
    };
    close.on('pointerdown', shut);
    dim.on('pointerdown', shut);
  }

  private toast(msg: string): void {
    const t = this.add
      .text(640, 620, msg, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#fff', backgroundColor: '#2fa25aee', padding: { x: 14, y: 8 } })
      .setOrigin(0.5)
      .setDepth(60);
    this.tweens.add({ targets: t, y: 590, alpha: 0, delay: 1100, duration: 500, onComplete: () => t.destroy() });
  }
}
