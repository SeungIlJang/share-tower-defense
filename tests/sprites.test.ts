import { describe, it, expect } from 'vitest';
import { parseManifest, resolveState, type SpriteDef } from '../src/systems/sprites';

const base = { file: 'a.png', frameWidth: 32, frameHeight: 32, anims: { idle: { frames: [0, 1] } } };

describe('parseManifest', () => {
  it('없거나 빈 매니페스트 → 빈 결과, 경고 없음', () => {
    expect(parseManifest(undefined)).toEqual({ manifest: {}, warnings: [] });
    expect(parseManifest({}).manifest).toEqual({});
  });
  it('기본값 채움(scale 2, footY=frameHeight, fps 8, nearest)', () => {
    const d = parseManifest({ soldier: base }).manifest.soldier;
    expect(d.scale).toBe(2);
    expect(d.footY).toBe(32);
    expect(d.anims.idle).toEqual({ frames: [0, 1], fps: 8 });
    expect(d.filter).toBe('nearest');
  });
  it('축소 배율이면 기본 필터 linear', () => {
    expect(parseManifest({ s: { ...base, scale: 0.4 } }).manifest.s.filter).toBe('linear');
  });
  it('_ 메모 키 무시', () => {
    const r = parseManifest({ _comment: 'x', soldier: base });
    expect(Object.keys(r.manifest)).toEqual(['soldier']);
    expect(r.warnings).toEqual([]);
  });
  it('잘못된 항목만 건너뛰고 경고', () => {
    const r = parseManifest({
      soldier: base,
      noFile: { ...base, file: '' },
      badSize: { ...base, frameWidth: 0 },
      noIdle: { ...base, anims: { walk: { frames: [0] } } },
    });
    expect(Object.keys(r.manifest)).toEqual(['soldier']);
    expect(r.warnings).toHaveLength(3);
  });
  it('잘못된 애니는 그 애니만 제외', () => {
    const r = parseManifest({ s: { ...base, anims: { idle: { frames: [0] }, walk: { frames: [-1] } } } });
    expect(r.manifest.s.anims.walk).toBeUndefined();
    expect(r.warnings).toHaveLength(1);
  });
});

describe('resolveState', () => {
  const def = parseManifest({ s: base }).manifest.s as SpriteDef;
  it('없는 walk/attack → idle, 없는 death → null', () => {
    expect(resolveState(def, 'idle')).toBe('idle');
    expect(resolveState(def, 'walk')).toBe('idle');
    expect(resolveState(def, 'attack')).toBe('idle');
    expect(resolveState(def, 'death')).toBeNull();
  });
});
