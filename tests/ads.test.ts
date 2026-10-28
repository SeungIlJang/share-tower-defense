import { describe, expect, it } from 'vitest';
import { AD_IDS, INTER_GAP_MS, shouldShowInterstitial } from '../src/systems/ads';

describe('📺 광고', () => {
  it('실제 광고 단위 ID 사용', () => {
    expect(AD_IDS.reward).toBe('ca-app-pub-9017259597860535/2611319996');
    expect(AD_IDS.inter).toBe('ca-app-pub-9017259597860535/5429055024');
  });
  it('게임오버 전면 — 3번 지면 1번, 3분 간격, 5관문 이후', () => {
    expect(shouldShowInterstitial(3, 3, INTER_GAP_MS, 0)).toBe(false); // 아직 초반
    expect(shouldShowInterstitial(2, 10, INTER_GAP_MS, 0)).toBe(false);
    expect(shouldShowInterstitial(3, 10, INTER_GAP_MS, 0)).toBe(true);
    expect(shouldShowInterstitial(6, 10, 100_000, 0)).toBe(false); // 3분 안 됨
  });
});
