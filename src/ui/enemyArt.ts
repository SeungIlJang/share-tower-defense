import Phaser from 'phaser';
import enemiesData from '../data/enemies.json';
import type { EnemyStats } from '../types';
import { spriteOf, textureKey } from '../systems/sprites';
import { ensureHue } from '../systems/skinTextures';
import { hexColor } from '../systems/enemyVariants';

const ENEMIES = enemiesData as Record<string, EnemyStats>;

/** 👾 적 초상(첫 프레임) — 전투와 같은 규칙: 전용 그림 → 색 회전 사본 → 곱하기 색. 없으면 null */
export function enemyPortrait(s: Phaser.Scene, type: string, x: number, y: number, maxW: number, maxH: number): Phaser.GameObjects.Sprite | null {
  const st = ENEMIES[type];
  const own = !!spriteOf(type) && s.textures.exists(textureKey(type));
  const look = own ? type : st?.hue !== undefined && st.look ? ensureHue(s, st.look, st.hue) : st?.look ?? type;
  const d = spriteOf(look);
  if (!d || !s.textures.exists(textureKey(look))) return null;
  const spr = s.add.sprite(x, y, textureKey(look), d.anims.idle?.frames[0] ?? 0).setFlipX(true);
  spr.setScale(Math.min(maxH / spr.height, maxW / spr.width));
  const tint = own ? null : hexColor(st?.tint);
  if (tint !== null) spr.setTint(tint);
  return spr;
}
