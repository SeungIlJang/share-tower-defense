import Phaser from 'phaser';
import { CHESTS, rankUpCost, type ChestLoot } from '../systems/chests';
import { iconKey, textureKey } from '../systems/sprites';
import { equipDef } from '../systems/equipment';
import { sfx } from '../systems/sound';
import { meta } from '../systems/upgrades';

/** 상자 그림(몸통·뚜껑·띠·자물쇠) — 뚜껑은 따로 돌려서 열 수 있게 */
function drawChest(s: Phaser.Scene, tier: number): { box: Phaser.GameObjects.Container; lid: Phaser.GameObjects.Container } {
  const d = CHESTS[tier];
  const body = s.add.graphics();
  body.fillStyle(0x000000, 0.25).fillEllipse(0, 46, 130, 18);
  body.fillStyle(d.color, 1).fillRoundedRect(-58, -6, 116, 52, 8);
  body.lineStyle(4, d.band, 1).strokeRoundedRect(-58, -6, 116, 52, 8);
  body.fillStyle(d.band, 1).fillRect(-8, -6, 16, 52);
  body.fillStyle(0xffe680, 1).fillRoundedRect(-10, 4, 20, 18, 4);
  const lidG = s.add.graphics();
  lidG.fillStyle(d.color, 1).fillRoundedRect(-62, -30, 124, 30, { tl: 18, tr: 18, bl: 4, br: 4 });
  lidG.lineStyle(4, d.band, 1).strokeRoundedRect(-62, -30, 124, 30, { tl: 18, tr: 18, bl: 4, br: 4 });
  lidG.fillStyle(d.band, 1).fillRect(-8, -30, 16, 30);
  lidG.fillStyle(0xffffff, 0.35).fillRoundedRect(-50, -26, 60, 6, 3);
  const lid = s.add.container(0, -4, [lidG]);
  const box = s.add.container(0, 0, [body, lid]);
  return { box, lid };
}

/** 🎁 결과 화면 왼쪽 상자 카드 — 탭하면 흔들 → 펑 → 보상 공개 */
export function chestCard(s: Phaser.Scene, x: number, y: number, loot: ChestLoot, unitName: (k: string) => string, z = 0): void {
  // z: 창 위에 띄울 때 — 이 카드가 만든 것(나중에 생기는 보상 줄 포함)을 모두 z만큼 위로
  const before = new Set(s.children.list);
  const lifted = new WeakSet<Phaser.GameObjects.GameObject>();
  const lift = (): void => {
    if (!z) return;
    for (const o of s.children.list) {
      if (before.has(o) || lifted.has(o)) continue;
      lifted.add(o);
      const d = o as Phaser.GameObjects.GameObject & { depth: number; setDepth?: (n: number) => unknown };
      d.setDepth?.(z + (d.depth ?? 0));
    }
  };
  const d = CHESTS[loot.tier];
  const g = s.add.graphics();
  g.fillStyle(0xffffff, 0.92).fillRoundedRect(x - 130, y - 150, 260, 300, 28);
  g.lineStyle(4, d.band, 1).strokeRoundedRect(x - 130, y - 150, 260, 300, 28);
  s.add.text(x, y - 122, `${d.icon} ${d.name}`, { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: `#${d.band.toString(16).padStart(6, '0')}` }).setOrigin(0.5);
  const { box, lid } = drawChest(s, loot.tier);
  box.setPosition(x, y - 10).setScale(1.25);
  // 등급이 높을수록 뒤에서 빛이 남
  const glow = s.add.circle(x, y - 14, 80, d.color, loot.tier >= 2 ? 0.35 : 0.18);
  box.setDepth(1);
  s.tweens.add({ targets: glow, scale: 1.2, alpha: 0.08, duration: 700, yoyo: true, repeat: -1 });
  s.tweens.add({ targets: box, y: y - 18, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  const hint = s.add.text(x, y + 100, '👆 눌러서 열기!', { fontFamily: 'sans-serif', fontSize: '20px', fontStyle: 'bold', color: '#ff7a2a' }).setOrigin(0.5);
  s.tweens.add({ targets: hint, scale: 1.1, duration: 400, yoyo: true, repeat: -1 });
  const hit = s.add.rectangle(x, y, 260, 300, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  let opened = false;
  const open = (): void => {
    if (opened) return;
    opened = true;
    hit.disableInteractive();
    hint.destroy();
    s.tweens.killTweensOf(box);
    sfx(s, 'click');
    // 흔들흔들(등급이 높을수록 오래)
    s.tweens.add({
      targets: box,
      angle: { from: -8, to: 8 },
      duration: 70,
      yoyo: true,
      repeat: 3 + loot.tier * 2,
      onComplete: () => {
        box.setAngle(0);
        s.tweens.add({ targets: lid, y: -70, angle: -35, alpha: 0, duration: 300, ease: 'Back.easeOut' });
        const flash = s.add.circle(x, y - 20, 30, 0xffffff, 0.95);
        s.tweens.add({ targets: flash, scale: 6, alpha: 0, duration: 450, onComplete: () => flash.destroy() });
        // 빛줄기
        for (let i = 0; i < 10; i++) {
          const ray = s.add.rectangle(x, y - 20, 6, 120, d.color, 0.7).setOrigin(0.5, 1).setAngle(i * 36);
          s.tweens.add({ targets: ray, scaleY: 1.6, alpha: 0, angle: ray.angle + 30, duration: 700, onComplete: () => ray.destroy() });
        }
        sfx(s, loot.tier >= 2 ? 'win' : 'levelup');
        s.tweens.add({ targets: box, y: y - 82, scale: 0.7, alpha: 0.35, duration: 400, delay: 250 });
        reveal();
        lift();
      },
    });
  };
  hit.on('pointerdown', open);
  lift();

  const reveal = (): void => {
    const rows: { icon: string | null; text: string; sub: string; sheet?: [string, number] }[] = [{ icon: null, text: `🪙 +${loot.gold}`, sub: '' }];
    const ed = loot.equip ? equipDef(loot.equip) : null;
    if (ed) {
      // 🛡️ 영웅 장비 — 새로 얻음 / 등급 업 / 최고 등급이라 골드
      const g = meta.equipGrade(ed.key);
      rows.push({ icon: 'equip', sheet: [textureKey(ed.kind === 'weapon' ? 'equip_weapon_icons' : 'equip_ring_icons'), ed.frame], text: `${ed.name} ${'★'.repeat(g)}`, sub: loot.equipGold ? `최고 등급! 🪙 +${loot.equipGold}` : g === 1 ? '새 장비! 강화 → 👑 영웅 탭' : '등급 업!' });
    }
    for (const [k, n] of Object.entries(loot.shards)) {
      const need = rankUpCost(meta.rank(k));
      rows.push({ icon: k, text: `🃏 ${unitName(k)} +${n}`, sub: need === null ? 'MAX' : `${meta.shards[k] ?? 0}/${need}${(meta.shards[k] ?? 0) >= need ? ' 랭크업 가능!' : ''}` });
    }
    rows.forEach((r, i) => {
      const ry = y - 5 + i * (rows.length > 4 ? 36 : 44);
      const parts: Phaser.GameObjects.GameObject[] = [];
      if (r.sheet && s.textures.exists(r.sheet[0])) parts.push(s.add.image(-96, 0, r.sheet[0], r.sheet[1]).setDisplaySize(40, 40));
      else if (r.icon && s.textures.exists(iconKey(r.icon))) parts.push(s.add.image(-96, 0, iconKey(r.icon)).setDisplaySize(40, 40));
      parts.push(s.add.text(r.icon ? -70 : 0, r.sub ? -9 : 0, r.text, { fontFamily: 'sans-serif', fontSize: r.icon ? '18px' : '26px', fontStyle: 'bold', color: r.icon ? '#3a3a5a' : '#e8a000' }).setOrigin(r.icon ? 0 : 0.5, 0.5));
      if (r.sub) parts.push(s.add.text(-70, 12, r.sub, { fontFamily: 'sans-serif', fontSize: '13px', fontStyle: 'bold', color: r.sub.includes('가능') || r.sub.includes('!') ? '#2fa25a' : '#7a86a8' }).setOrigin(0, 0.5));
      const row = s.add.container(x, ry, parts).setScale(0).setDepth(5);
      s.tweens.add({ targets: row, scale: 1, delay: 350 + i * 220, duration: 260, ease: 'Back.easeOut', onStart: () => sfx(s, 'coin', 1 + i * 0.1) });
    });
  };
}

/** 🎁 창으로 띄우는 상자(광고 상자·무료 상자) — 열고 나서 닫기 */
export function chestPopup(s: Phaser.Scene, loot: ChestLoot, unitName: (k: string) => string, onClose?: () => void): void {
  const Z = 400;
  const before = new Set(s.children.list);
  const dim = s.add.rectangle(640, 360, 4000, 720, 0x000000, 0.6).setDepth(Z).setInteractive();
  chestCard(s, 640, 340, loot, unitName, Z + 1);
  const close = s.add
    .text(640, 528, '닫기', { fontFamily: 'sans-serif', fontSize: '22px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#4a8bff', padding: { x: 26, y: 8 } })
    .setOrigin(0.5)
    .setDepth(Z + 20)
    .setInteractive({ useHandCursor: true });
  void dim;
  close.on('pointerdown', () => {
    for (const o of [...s.children.list]) {
      if (before.has(o)) continue;
      s.tweens.killTweensOf(o);
      o.destroy();
    }
    onClose?.();
  });
}
