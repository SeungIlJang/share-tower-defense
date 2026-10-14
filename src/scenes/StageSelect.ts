import Phaser from 'phaser';
import stagesData from '../data/stages.json';
import type { StageData } from '../types';
import { meta } from '../systems/upgrades';
import { iconKey, spriteOf, textureKey } from '../systems/sprites';
import { bgm } from '../systems/sound';
import { cuteButton, cuteTitle, drawSky } from '../ui/cute';

const stages = stagesData as StageData[];
const WORLDS = [
  { id: 1, name: '🌳 관문의 숲', theme: 'forest', color: 0x3f9a4a, dark: 0x2a6a32 },
  { id: 2, name: '🏜️ 모래 사막', theme: 'desert', color: 0xd8862a, dark: 0xa05a10 },
] as const;
/** 보스 스테이지 → 위에 올려 보여줄 보스 그림 */
const BOSS_OF: Record<number, string> = { 5: 'ogre', 10: 'dragon', 15: 'ogre', 20: 'dragon' };

/** 스테이지 선택 — S자 길 위의 징검다리 지도 */
export class StageSelectScene extends Phaser.Scene {
  constructor() {
    super('StageSelect');
  }

  private world = 1;

  init(data: { world?: number }): void {
    // 기본: 지금 진행 중인 월드(마지막으로 깬 스테이지 다음)
    const next = stages.find((s) => s.id === meta.clearedMax + 1) ?? stages[stages.length - 1];
    this.world = data.world ?? next.world ?? 1;
  }

  create(): void {
    const W = WORLDS[this.world - 1];
    const list = stages.filter((st) => (st.world ?? 1) === this.world);
    drawSky(this, { stars: 10, theme: W.theme });
    bgm(this, 'bgm_menu');

    const title = cuteTitle(this, 640, 62, '스테이지 선택', 52);
    this.tweens.add({ targets: title, y: 56, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // 월드 리본
    const ribbon = this.add.graphics();
    ribbon.fillStyle(W.color, 1).fillRoundedRect(640 - 110, 104, 220, 38, 19);
    ribbon.lineStyle(3, 0xffffff, 0.9).strokeRoundedRect(640 - 110, 104, 220, 38, 19);
    this.add.text(640, 123, W.name, { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
    // 월드 넘기기 ◀ ▶ — 다음 월드는 앞 월드 마지막 스테이지를 깨야 열림
    const arrow = (x: number, to: number, label: string): void => {
      if (to < 1 || to > WORLDS.length) return;
      const firstOf = stages.find((st) => (st.world ?? 1) === to)!;
      const open = meta.isUnlocked(firstOf.id);
      const b = cuteButton(this, x, 123, 64, 40, open ? label : '🔒', open ? W.color : 0xb8c0cc, open ? W.dark : 0x8a92a0, '20px', () => {
        if (open) this.scene.start('StageSelect', { world: to });
      });
      if (!open) b.setAlpha(0.8);
    };
    arrow(470, this.world - 1, '◀');
    arrow(810, this.world + 1, '▶');

    const points = this.nodePoints(list.length);
    this.drawPath(points);
    list.forEach((st, i) => this.drawNode(st, points[i]));

    // 마지막 월드면 '다음 월드 준비 중' 팻말
    if (this.world === WORLDS.length) {
      const last = points[points.length - 1];
      const sign = this.add.container(last.x - 175, last.y + 4);
      const sg = this.add.graphics();
      sg.fillStyle(0x8a5a2a, 1).fillRect(-4, 0, 8, 46);
      sg.fillStyle(0xc8925a, 1).fillRoundedRect(-62, -30, 124, 40, 10);
      sg.lineStyle(3, 0x6a4020, 1).strokeRoundedRect(-62, -30, 124, 40, 10);
      sign.add([sg, this.add.text(0, -10, '다음 월드\n준비 중 🚧', { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#4a2a10', align: 'center' }).setOrigin(0.5)]);
    }

    // ♾️ 무한 모드 — 언제든 도전
    cuteButton(this, 640, 668, 260, 54, '♾️ 무한 모드', 0xa07aff, 0x7a4ad8, '22px', () => this.scene.start('Battle', { stageId: 0, mode: 'endless' }));
    this.add
      .text(640, 618, meta.endlessBest > 0 ? `최고 기록 🌊 웨이브 ${meta.endlessBest}` : '끝없는 웨이브에 도전!', { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#5a3aa8', backgroundColor: '#f0e8ffd0', padding: { x: 10, y: 4 } })
      .setOrigin(0.5);

    // 하단 버튼
    cuteButton(this, 150, 668, 180, 54, '🏠 홈', 0x4a8bff, 0x2a5fd0, '22px', () => this.scene.start('Menu'));
    this.add
      .text(1130, 610, `총 ⭐ ${meta.totalStars} / ${stages.length * 3}`, { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#7a5a00', backgroundColor: '#fff3c8', padding: { x: 12, y: 5 } })
      .setOrigin(0.5);
    cuteButton(this, 1130, 668, 180, 54, '🔧 강화', 0xffc94a, 0xd8962a, '22px', () => this.scene.start('Upgrade'));
  }

  /** S자 배치: 위 줄 왼→오, 아래 줄 오→왼 */
  private nodePoints(n: number): { x: number; y: number }[] {
    const perRow = Math.ceil(n / 2);
    const xs = Array.from({ length: perRow }, (_, i) => 300 + (i * (1080 - 300)) / (perRow - 1));
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const x = row === 0 ? xs[col] : xs[perRow - 1 - col];
      const wave = Math.sin(col * 1.3) * 18; // 살짝 구불구불
      pts.push({ x, y: (row === 0 ? 255 : 470) + wave });
    }
    return pts;
  }

  /** 점선 길 */
  private drawPath(pts: { x: number; y: number }[]): void {
    const g = this.add.graphics();
    const curve = new Phaser.Curves.Spline(pts.flatMap((p) => [p.x, p.y]));
    const sample = curve.getSpacedPoints(160);
    g.lineStyle(26, 0xf1dcae, 1);
    g.strokePoints(sample, false);
    g.fillStyle(0xffffff, 0.9);
    sample.forEach((p, i) => {
      if (i % 4 === 0) g.fillCircle(p.x, p.y, 3.5);
    });
  }

  private drawNode(stage: StageData, p: { x: number; y: number }): void {
    const id = stage.id;
    const unlocked = meta.isUnlocked(id);
    const cleared = id <= meta.clearedMax;
    const current = unlocked && !cleared;
    const boss = BOSS_OF[id];
    const r = boss ? 50 : 40;

    const fill = cleared ? 0x5cd88a : current ? 0x4a8bff : 0xb8c0cc;
    const dark = cleared ? 0x2fa25a : current ? 0x2a5fd0 : 0x8a92a0;
    const node = this.add.container(p.x, p.y);
    const g = this.add.graphics();
    g.fillStyle(dark, 1).fillCircle(0, 6, r);
    g.fillStyle(fill, 1).fillCircle(0, 0, r);
    g.fillStyle(0xffffff, 0.3).fillEllipse(0, -r * 0.45, r * 1.2, r * 0.5);
    g.lineStyle(4, 0xffffff, 1).strokeCircle(0, 0, r);
    node.add(g);

    if (unlocked) {
      node.add(
        this.add
          .text(0, -2, String(id), { fontFamily: 'sans-serif', fontSize: boss ? '40px' : '34px', fontStyle: 'bold', color: '#ffffff', stroke: '#00000055', strokeThickness: 5 })
          .setOrigin(0.5)
      );
    } else {
      node.add(this.add.text(0, 0, '🔒', { fontSize: '30px' }).setOrigin(0.5));
    }
    if (cleared) {
      // 별 기록(1~3) — 켜진 별 금색, 빈 별 흰색
      const n = Math.max(1, meta.starsOf(id));
      for (let k = 0; k < 3; k++) {
        node.add(
          this.add
            .text((k - 1) * 20, r - 4 - (k === 1 ? 4 : 0), '★', { fontSize: '22px', color: k < n ? '#ffc93a' : '#ffffff', stroke: '#7a5a00', strokeThickness: 3 })
            .setOrigin(0.5)
        );
      }
    }

    // 이름표
    const name = boss ? `👑 보스 ${id}` : stage.name;
    this.add
      .text(p.x, p.y + r + 22, name, { fontFamily: 'sans-serif', fontSize: '15px', fontStyle: 'bold', color: boss ? '#c0303a' : '#2a3a6a', backgroundColor: '#ffffffd0', padding: { x: 8, y: 3 } })
      .setOrigin(0.5);

    // 보스 그림
    if (boss) {
      const d = spriteOf(boss);
      if (d && this.textures.exists(textureKey(boss))) {
        const s = this.add
          .sprite(p.x + r * 0.9, p.y - r * 0.6, textureKey(boss), d.anims.idle!.frames[0])
          .setScale((d.scale * 52) / (d.frameHeight * d.scale))
          .setAlpha(unlocked ? 1 : 0.5)
          .setFlipX(true);
        this.tweens.add({ targets: s, y: s.y - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }

    if (current) {
      // 지금 할 차례 — 통통 + 기사 얼굴 표시
      this.tweens.add({ targets: node, scale: 1.08, duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      if (this.textures.exists(iconKey('knight'))) {
        const face = this.add.image(p.x, p.y - r - 30, iconKey('knight')).setDisplaySize(44, 44);
        const pin = this.add.triangle(p.x, p.y - r - 6, -8, 0, 8, 0, 0, 10, 0xffffff);
        this.tweens.add({ targets: [face, pin], y: '-=8', duration: 520, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    }

    if (unlocked) {
      const hit = this.add.circle(p.x, p.y, r + 6, 0x000000, 0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.tweens.add({ targets: node, angle: 6, duration: 100, yoyo: true }));
      hit.on('pointerdown', () => {
        this.tweens.add({ targets: node, scale: 0.9, duration: 80, yoyo: true });
        this.time.delayedCall(170, () => this.scene.start('Battle', { stageId: id })); // 눌림 연출 후 이동(통통 트윈과 무관하게)
      });
    }
  }
}
