import { describe, expect, it } from 'vitest';
import { DEV_PIN_HASH, DEV_PIN_LEN, checkDevPin, fmt, sha256Hex } from '../src/systems/dev';

describe('🛠️ 개발자 모드', () => {
  it('SHA-256 계산이 맞음', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('비밀번호는 해시만 저장(64자리) · 6자리', () => {
    expect(DEV_PIN_HASH).toMatch(/^[0-9a-f]{64}$/);
    expect(DEV_PIN_LEN).toBe(6);
  });

  it('틀린 비밀번호는 거부', async () => {
    expect(await checkDevPin('000000')).toBe(false);
    expect(await checkDevPin('')).toBe(false);
  });

  it('숫자 표시', () => {
    expect(fmt(1234567)).toBe('1,234,567');
  });
});
