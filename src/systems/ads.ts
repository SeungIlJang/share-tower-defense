import { track } from './analytics';
/**
 * 리워드 광고 — 네이티브(Capacitor)는 @capacitor-community/admob,
 * 웹/개발은 시뮬레이션(짧은 대기 후 보상 지급).
 *
 * ⚠️⚠️ 아래는 구글 공식 "테스트" 광고단위 ID 입니다.
 *   출시(프로덕션) 전에 반드시 AdMob 콘솔의 "실제 광고단위 ID"로 교체하세요.
 *   테스트 ID를 그대로 출시하면 수익 0 + 정책 위반 위험.
 */
const TEST_REWARD_ANDROID = 'ca-app-pub-3940256099942544/5224354917';
const TEST_REWARD_IOS = 'ca-app-pub-3940256099942544/1712485313';

// 출시 시 여기에 실제 ID를 넣고 USE_TEST_ADS=false 로 바꾸세요.
const USE_TEST_ADS = true;

/** 🚫 출시 전: 광고를 아예 띄우지 않고 바로 보상(웹과 동일). 출시 때 true로 */
const ADS_ENABLED = false;
const PROD_REWARD_ANDROID = ''; // TODO: 실제 Android 리워드 광고단위 ID
const PROD_REWARD_IOS = ''; // TODO: 실제 iOS 리워드 광고단위 ID

function isNative(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } }).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

function platform(): string {
  const cap = (globalThis as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() ?? 'web';
}

function rewardAdId(): string {
  const ios = platform() === 'ios';
  if (USE_TEST_ADS) return ios ? TEST_REWARD_IOS : TEST_REWARD_ANDROID;
  return ios ? PROD_REWARD_IOS : PROD_REWARD_ANDROID;
}

let initialized = false;

export async function initAds(): Promise<void> {
  if (!ADS_ENABLED || !isNative() || initialized) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.initialize({ initializeForTesting: USE_TEST_ADS });
    initialized = true;
  } catch {
    /* 광고 초기화 실패는 치명적이지 않음 — 게임은 계속 */
  }
}

const wait = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/**
 * 리워드 광고 노출 → 끝까지 봤으면 true(보상 지급).
 * 웹/개발 환경은 광고가 없으므로 시뮬레이션으로 true 반환.
 */
export async function showRewarded(placement = 'unknown'): Promise<boolean> {
  const ok = await showRewardedInner();
  track('ad_reward', { placement, ok, live: ADS_ENABLED && isNative() }); // 📊 광고 자리별 시청
  return ok;
}

async function showRewardedInner(): Promise<boolean> {
  if (!ADS_ENABLED || !isNative()) {
    await wait(500); // 웹·출시 전: 광고 없음(보상은 바로 지급)
    return true;
  }
  try {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
    await initAds();
    let rewarded = false;
    const sub = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      rewarded = true;
    });
    await AdMob.prepareRewardVideoAd({ adId: rewardAdId() });
    await AdMob.showRewardVideoAd();
    await sub.remove();
    return rewarded;
  } catch {
    return false; // 광고 실패 시 보상 없음
  }
}
