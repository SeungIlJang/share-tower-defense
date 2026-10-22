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
import { enemyPortrait } from '../ui/enemyArt';

const ENEMIES = enemiesData as Record<string, EnemyStats>;
const UNITS = unitsData as Record<string, UnitStats>;

const ABILITY: Record<string, string> = {
  explode: '💥 죽을 때 폭발',
  heal: '💚 주변 적 회복',
  lifesteal: '🩸 흡혈',
  rage: '😡 체력이 낮으면 광폭',
  split: '🟢 죽으면 분열',
  summon: '💀 부하 소환',
};

/** 📖 몬스터 도감 — 잡은 적은 그림·이름이 보이고, 못 잡은 적은 그림자. 발견 보상 · 수집 단계 보상 */
export class CodexScene extends Phaser.Scene {
  private layer!: Phaser.GameObjects.Container;

  constructor() {
    super('Codex');
  }

  create(): void {
    drawSky(this, { stars: 10 });
    cuteTitle(this, 640, 40, '📖 몬스터 도감', 40);
    this.layer = this.add.container(0, 0);
    this.render();
    cuteButton(this, 640, 676, 240, 54, '🏠 홈으로', 0x4a8bff, 0x2a5fd0, '22px', () => this.scene.start('Menu'));
  }

  private render(): void {
    this.layer.removeAll(true);
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
      this.add.text(540, 93, `발견 ${found} / ${keys.length}`, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }).setOrigin(0.5),
    ]);
    if (step) {
      const label = can >= 0 ? `🎁 ${step.need}마리 보상 받기!` : `🎁 ${step.need}마리: 🪙${step.gold} + 🃏전 유닛 ${step.shards}`;
      const t = this.add
        .text(800, 93, label, { fontFamily: 'sans-serif', fontSize: '16px', fontStyle: 'bold', color: '#fff', backgroundColor: can >= 0 ? '#2fa25a' : '#4a5578', padding: { x: 10, y: 5 } })
        .setOrigin(0, 0.5);
      if (can >= 0) {
        t.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
          const r = meta.claimCodexStep(Object.keys(UNITS).filter((k) => meta.ownsUnit(k)));
          if (!r) return;
          sfx(this, 'win');
          this.toast(`🎉 🪙 +${r.gold} · 🃏 모든 유닛 조각 +${r.shards}`);
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
          this.toast(`📖 ${ENEMIES[k].name} 발견 보상 🪙 +${g}`);
          this.render();
        } else this.detail(k);
      });
      this.layer.add(parts);
    });
  }

  /** 적 자세히 — 능력치 · 종류 · 상대하기 좋은 유닛 */
  private detail(k: string): void {
    const seen = (meta.kills[k] ?? 0) > 0;
    const e = ENEMIES[k];
    const d = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0.55).setInteractive();
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.97).fillRoundedRect(390, 170, 500, 380, 28);
    g.lineStyle(4, isBoss(k) ? 0xff6a6a : 0x6a8ad8, 1).strokeRoundedRect(390, 170, 500, 380, 28);
    d.add([dim, g]);
    if (!seen) {
      d.add(this.add.text(640, 340, `❓ 아직 못 잡은 적이에요\n\n잡으면 도감에 등록되고\n발견 보상 🪙${discoverReward(k)}을 받아요`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#4a5a7a', align: 'center' }).setOrigin(0.5));
    } else {
      const art = enemyPortrait(this, k, 520, 290, 160, 140);
      if (art) d.add(art);
      const kind = enemyKind(k);
      const counters = kind ? Object.keys(UNITS).filter((u) => UNIT_COUNTER[u] === kind).map((u) => UNITS[u].name) : [];
      const lines = [
        `${isBoss(k) ? '👑 ' : ''}${e.name}`,
        `❤️ ${e.hp}   ⚔️ ${e.atk}   🛡️ ${e.def}`,
        `🏃 이동 ${e.speed}   🎯 사거리 ${e.range}`,
        kind ? `${KIND_INFO[kind].icon} ${KIND_INFO[kind].name}` : '',
        e.ability ? ABILITY[e.ability] ?? '' : '',
        `🗡️ 처치 ${meta.kills[k]}  ${'★'.repeat(codexStars(meta.kills[k] ?? 0))}`,
      ].filter(Boolean);
      d.add(this.add.text(620, 196, lines.join('\n'), { fontFamily: 'sans-serif', fontSize: '19px', fontStyle: 'bold', color: '#2a3350', lineSpacing: 10 }).setOrigin(0, 0));
      if (counters.length) d.add(this.add.text(640, 430, `🎯 상대하기 좋은 유닛: ${counters.join(' · ')} (피해 ×1.5)`, { fontFamily: 'sans-serif', fontSize: '17px', fontStyle: 'bold', color: '#2fa25a' }).setOrigin(0.5));
      d.add(this.add.text(640, 462, '★ 처치 1 · ★★ 50 · ★★★ 300', { fontFamily: 'sans-serif', fontSize: '14px', color: '#8a96b8' }).setOrigin(0.5));
    }
    const close = this.add.text(640, 512, '닫기', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#fff', backgroundColor: '#4a8bff', padding: { x: 26, y: 8 } }).setOrigin(0.5).setInteractive({ useHandCursor: true });
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
