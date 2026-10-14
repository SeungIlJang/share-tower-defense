/**
 * 픽셀아트 스프라이트 매니페스트 (순수 로직 — Vitest 검증)
 *
 * public/sprites/manifest.json 에 등록된 타입만 스프라이트로 그리고,
 * 나머지는 visuals.ts 의 벡터 도형으로 폴백 → 그림을 한 종씩 교체 가능.
 */

export type AnimState = 'idle' | 'walk' | 'attack' | 'death';
export const ANIM_STATES: AnimState[] = ['idle', 'walk', 'attack', 'death'];

/** 반복 재생하는 상태(공격·사망은 1회) */
export const LOOPING: Record<AnimState, boolean> = { idle: true, walk: true, attack: false, death: false };

export interface AnimDef {
  frames: number[]; // 시트 내 프레임 index(좌→우, 위→아래)
  fps: number;
}

export interface SpriteDef {
  file: string; // public/sprites/ 기준 경로
  frameWidth: number;
  frameHeight: number;
  scale: number; // 정수 배율 권장(픽셀 뭉개짐 방지)
  footY: number; // 프레임 상단에서 발바닥까지 px(원본 기준) — 레인에 발을 맞춤
  filter: 'nearest' | 'linear'; // 확대(진짜 도트)=nearest, 축소(고해상도 도트풍)=linear
  anims: Partial<Record<AnimState, AnimDef>>;
  icon?: string; // HUD 슬롯 얼굴 아이콘(public/sprites/ 기준)
}

export type SpriteManifest = Record<string, SpriteDef>;

export const MANIFEST_URL = 'sprites/manifest.json';

export function textureKey(type: string): string {
  return `spr_${type}`;
}

export function iconKey(type: string): string {
  return `icon_${type}`;
}

export function animKey(type: string, state: AnimState): string {
  return `${type}_${state}`;
}

const isPosInt = (n: unknown): n is number => typeof n === 'number' && Number.isInteger(n) && n > 0;

function parseAnim(raw: unknown): AnimDef | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as { frames?: unknown; fps?: unknown };
  if (!Array.isArray(a.frames) || a.frames.length === 0) return null;
  if (!a.frames.every((f) => Number.isInteger(f) && f >= 0)) return null;
  const fps = typeof a.fps === 'number' && a.fps > 0 ? a.fps : 8;
  return { frames: a.frames as number[], fps };
}

/**
 * 매니페스트 검증 — 잘못된 항목은 건너뛰고(경고 목록 반환) 나머지만 사용.
 * idle 애니메이션은 필수(정지 상태 표시용).
 */
export function parseManifest(raw: unknown): { manifest: SpriteManifest; warnings: string[] } {
  const manifest: SpriteManifest = {};
  const warnings: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { manifest, warnings: raw == null ? [] : ['manifest: 객체가 아님'] };
  }
  for (const [type, value] of Object.entries(raw as Record<string, unknown>)) {
    if (type.startsWith('_')) continue; // "_comment" 등 메모용 키
    const d = value as Partial<SpriteDef> | null;
    if (!d || typeof d !== 'object' || typeof d.file !== 'string' || !d.file) {
      warnings.push(`${type}: file 누락`);
      continue;
    }
    if (!isPosInt(d.frameWidth) || !isPosInt(d.frameHeight)) {
      warnings.push(`${type}: frameWidth/frameHeight 는 양의 정수`);
      continue;
    }
    const anims: Partial<Record<AnimState, AnimDef>> = {};
    const rawAnims = (d.anims ?? {}) as Record<string, unknown>;
    for (const s of ANIM_STATES) {
      if (rawAnims[s] === undefined) continue;
      const a = parseAnim(rawAnims[s]);
      if (a) anims[s] = a;
      else warnings.push(`${type}.${s}: frames 형식 오류`);
    }
    if (!anims.idle) {
      warnings.push(`${type}: idle 애니메이션 필수`);
      continue;
    }
    const scale = typeof d.scale === 'number' && d.scale > 0 ? d.scale : 2;
    const footY = typeof d.footY === 'number' && d.footY > 0 ? Math.min(d.footY, d.frameHeight) : d.frameHeight;
    const filter = d.filter === 'nearest' || d.filter === 'linear' ? d.filter : scale >= 1 ? 'nearest' : 'linear';
    manifest[type] = { file: d.file, frameWidth: d.frameWidth, frameHeight: d.frameHeight, scale, footY, filter, anims };
    if (typeof d.icon === 'string' && d.icon) manifest[type].icon = d.icon;
  }
  return { manifest, warnings };
}

/** 상태 애니메이션이 없으면 대체 상태(걷기·공격 없으면 idle 유지) */
export function resolveState(def: SpriteDef, state: AnimState): AnimState | null {
  if (def.anims[state]) return state;
  if (state === 'death') return null; // 사망 애니 없으면 기존 파티클만
  return 'idle';
}

/**
 * 기지 파손 단계 — stages장 중 몇 번째를 보일지(0=멀쩡).
 * HP 구간을 균등 분할: 3장이면 100~67% → 0, 67~33% → 1, 33% 이하 → 2.
 */
export function damageStage(hp: number, maxHp: number, stages: number): number {
  if (stages <= 1 || maxHp <= 0) return 0;
  const lost = 1 - Math.max(0, Math.min(1, hp / maxHp));
  return Math.min(stages - 1, Math.floor(lost * stages));
}

/** 로드된 매니페스트(Preload에서 채움) */
export const sprites: { manifest: SpriteManifest } = { manifest: {} };

export function spriteOf(type: string): SpriteDef | undefined {
  return sprites.manifest[type];
}
