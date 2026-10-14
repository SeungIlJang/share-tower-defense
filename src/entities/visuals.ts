import Phaser from 'phaser';

/** 유닛/적 외형 스펙 — 프로토타입(벡터 도형)으로도 타입별로 확실히 달라 보이게 */
export interface Visual {
  bodyW: number;
  bodyH: number;
  body: number;
  shape: 'rect' | 'ellipse';
  head: boolean;
  headColor: number;
  weapon: 'sword' | 'bow' | 'shield' | 'spear' | 'staff' | 'club' | 'dagger' | 'wing' | 'none';
  weaponColor: number;
}

const SKIN = 0xf2c79a;

export const VISUALS: Record<string, Visual> = {
  // 아군
  soldier: { bodyW: 22, bodyH: 34, body: 0x4a9eff, shape: 'rect', head: true, headColor: SKIN, weapon: 'sword', weaponColor: 0xe8edf4 },
  archer: { bodyW: 20, bodyH: 30, body: 0x5cff9e, shape: 'rect', head: true, headColor: SKIN, weapon: 'bow', weaponColor: 0xffd24d },
  knight: { bodyW: 30, bodyH: 42, body: 0xb98cff, shape: 'rect', head: true, headColor: 0xcfd3da, weapon: 'shield', weaponColor: 0x9aa3b0 },
  spear: { bodyW: 20, bodyH: 34, body: 0x4ad0e0, shape: 'rect', head: true, headColor: SKIN, weapon: 'spear', weaponColor: 0xd8d2b0 },
  mage: { bodyW: 20, bodyH: 32, body: 0xd58cff, shape: 'rect', head: true, headColor: SKIN, weapon: 'staff', weaponColor: 0x7cf6ff },
  rogue: { bodyW: 20, bodyH: 30, body: 0x3f6a3a, shape: 'rect', head: true, headColor: SKIN, weapon: 'dagger', weaponColor: 0xe8edf4 },
  cleric: { bodyW: 20, bodyH: 32, body: 0xf0f0ff, shape: 'rect', head: true, headColor: SKIN, weapon: 'staff', weaponColor: 0xffd34d },
  earthmage: { bodyW: 20, bodyH: 32, body: 0x4a7a3a, shape: 'rect', head: true, headColor: SKIN, weapon: 'staff', weaponColor: 0xff9a3c },
  darkmage: { bodyW: 20, bodyH: 32, body: 0x4a2a6a, shape: 'rect', head: true, headColor: SKIN, weapon: 'staff', weaponColor: 0xb98cff },
  shield: { bodyW: 32, bodyH: 40, body: 0x6a7a96, shape: 'rect', head: true, headColor: 0xb8c0cc, weapon: 'shield', weaponColor: 0xd8b04a },
  cavalry: { bodyW: 42, bodyH: 34, body: 0x8a5a2a, shape: 'rect', head: true, headColor: SKIN, weapon: 'spear', weaponColor: 0xd8d2b0 },
  cannon: { bodyW: 30, bodyH: 26, body: 0x3a3f4a, shape: 'rect', head: true, headColor: SKIN, weapon: 'club', weaponColor: 0x202430 },
  // 적
  goblin: { bodyW: 18, bodyH: 26, body: 0xff5a6e, shape: 'rect', head: true, headColor: 0xe88a6a, weapon: 'dagger', weaponColor: 0xcccccc },
  orc: { bodyW: 32, bodyH: 44, body: 0xb0392b, shape: 'rect', head: true, headColor: 0x7aa05a, weapon: 'club', weaponColor: 0x8a5a2a },
  wolf: { bodyW: 36, bodyH: 20, body: 0x9aa0a8, shape: 'ellipse', head: true, headColor: 0x8a9098, weapon: 'none', weaponColor: 0 },
  slime: { bodyW: 30, bodyH: 24, body: 0x6ad06a, shape: 'ellipse', head: false, headColor: 0, weapon: 'none', weaponColor: 0 },
  bat: { bodyW: 20, bodyH: 16, body: 0x9a6bd0, shape: 'ellipse', head: true, headColor: 0x9a6bd0, weapon: 'wing', weaponColor: 0x6a4ba0 },
  skeleton: { bodyW: 20, bodyH: 32, body: 0xe8e4d8, shape: 'rect', head: true, headColor: 0xf4f0e4, weapon: 'sword', weaponColor: 0xc0c8d0 },
  mushroom: { bodyW: 24, bodyH: 26, body: 0xf0d8c0, shape: 'ellipse', head: true, headColor: 0xd83a3a, weapon: 'none', weaponColor: 0 },
  ghost: { bodyW: 24, bodyH: 30, body: 0xe8f0ff, shape: 'ellipse', head: false, headColor: 0, weapon: 'none', weaponColor: 0 },
  dragon: { bodyW: 80, bodyH: 70, body: 0x3a2030, shape: 'ellipse', head: true, headColor: 0xc0302a, weapon: 'wing', weaponColor: 0xc0302a },
  ogre: { bodyW: 52, bodyH: 72, body: 0x7a2d6a, shape: 'rect', head: true, headColor: 0x6a9a4a, weapon: 'club', weaponColor: 0x8a5a2a },
};

const FALLBACK: Visual = VISUALS.soldier;

export function visualOf(type: string): Visual {
  return VISUALS[type] ?? FALLBACK;
}

/** 캐릭터 도형들을 생성해 반환(로컬 좌표, 오른쪽을 바라봄). */
export function buildChar(scene: Phaser.Scene, type: string): Phaser.GameObjects.GameObject[] {
  const v = visualOf(type);
  const parts: Phaser.GameObjects.GameObject[] = [];
  const front = v.bodyW / 2;
  // 그림자
  parts.push(scene.add.ellipse(0, v.bodyH / 2 + 4, v.bodyW + 6, 8, 0x000000, 0.25));
  // 몸
  if (v.shape === 'ellipse') parts.push(scene.add.ellipse(0, 0, v.bodyW, v.bodyH, v.body));
  else parts.push(scene.add.rectangle(0, 0, v.bodyW, v.bodyH, v.body).setStrokeStyle(2, 0x000000, 0.18));
  // 머리
  if (v.head) {
    const hr = Math.max(6, v.bodyW * 0.34);
    parts.push(scene.add.circle(0, -v.bodyH / 2 - hr * 0.6, hr, v.headColor).setStrokeStyle(2, 0x000000, 0.15));
    parts.push(scene.add.circle(hr * 0.35, -v.bodyH / 2 - hr * 0.6, 1.6, 0x202020)); // 눈
  }
  // 무기/특징
  const wc = v.weaponColor;
  switch (v.weapon) {
    case 'sword':
      parts.push(scene.add.rectangle(front + 3, -6, 4, 24, wc));
      parts.push(scene.add.rectangle(front + 3, 5, 10, 3, 0x6a4a2a));
      break;
    case 'bow':
      parts.push(scene.add.arc(front + 4, 0, 14, -70, 70, false, wc).setStrokeStyle(3, wc));
      break;
    case 'shield':
      parts.push(scene.add.rectangle(front + 2, 0, 10, 24, wc).setStrokeStyle(2, 0x5a6472));
      break;
    case 'spear':
      parts.push(scene.add.rectangle(front + 8, -2, 4, 44, wc));
      parts.push(scene.add.triangle(front + 8, -24, 0, 8, 8, 8, 4, 0, 0xd0d0d8));
      break;
    case 'staff':
      parts.push(scene.add.rectangle(front + 5, 0, 3, 28, 0x8a6a3a));
      parts.push(scene.add.circle(front + 5, -16, 6, wc).setStrokeStyle(2, 0xffffff, 0.5));
      break;
    case 'club':
      parts.push(scene.add.rectangle(front + 6, -4, 8, 22, wc));
      break;
    case 'dagger':
      parts.push(scene.add.rectangle(front + 2, 0, 3, 12, wc));
      break;
    case 'wing':
      parts.push(scene.add.triangle(-v.bodyW / 2 - 2, 0, 0, -8, 0, 8, -12, 0, wc));
      parts.push(scene.add.triangle(v.bodyW / 2 + 2, 0, 0, -8, 0, 8, 12, 0, wc));
      break;
    default:
      break;
  }
  return parts;
}
