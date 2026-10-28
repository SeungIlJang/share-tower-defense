import { track } from './analytics';
/**
 * 📺 광고 — 네이티브(Capacitor)는 @capacitor-community/admob, 웹/개발은 시뮬레이션(짧은 대기 후 보상 지급).
 * - 보상형: 부활 · 골드 2배 · 상자 하나 더 · 오늘의 무료 상자
 * - 전면(게임오버): 패배 결과 화면에서 가끔(3번 지면 1번, 5관문 이후, 3분 간격) — 처음 하는 사람은 안 봄
 * - 배너: ID만 준비(전투 화면 아래 HUD를 가려서 지금은 안 씀)
 * - GDPR: 시작할 때 동의 정보 확인 → 필요하면 동의 창(AdMob에서 만든 메시지), 동의 전엔 광고 안 띄움
 *
 * 🔒 실제 광고는 'LDAds' 표시가 있는 앱(versionCode 7부터, capacitor.config.ts appendUserAgent)에서만.
 *    예전 앱은 매니페스트에 테스트 앱 ID가 들어 있어 실제 광고 단위를 쓰면 안 됨 → 예전처럼 바로 보상.
 */
const AD_USE_TEST = false;
const AD_APP_ID = 'ca-app-pub-9017259597860535~2635370729'; // AndroidManifest APPLICATION_ID와 같음(참고용)
const AD_BANNER_REAL = 'ca-app-pub-9017259597860535/8676988710';
const AD_INTER_REAL = 'ca-app-pub-9017259597860535/5429055024';
const AD_REWARD_REAL = 'ca-app-pub-9017259597860535/2611319996';
// 구글 공식 테스트 단위(AD_USE_TEST = true일 때)
const AD_BANNER_TEST = 'ca-app-pub-3940256099942544/6300978111';
const AD_INTER_TEST = 'ca-app-pub-3940256099942544/1033173712';
const AD_REWARD_TEST = 'ca-app-pub-3940256099942544/5224354917';
void AD_APP_ID;

export const AD_IDS = {
  banner: AD_USE_TEST ? AD_BANNER_TEST : AD_BANNER_REAL,
  inter: AD_USE_TEST ? AD_INTER_TEST : AD_INTER_REAL,
  reward: AD_USE_TEST ? AD_REWARD_TEST : AD_REWARD_REAL,
};

function isNative(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

/** 실제 광고를 띄울 수 있는 앱인가(새 AAB = UA에 LDAds) */
function liveAds(): boolean {
  return isNative() && typeof navigator !== 'undefined' && navigator.userAgent.includes('LDAds');
}

let initialized = false;
let canRequest = false; // GDPR 동의 결과(광고 요청 가능)

export async function initAds(): Promise<void> {
  if (!liveAds() || initialized) return;
  try {
    const { AdMob, AdmobConsentStatus } = await import('@capacitor-community/admob');
    await AdMob.initialize({ initializeForTesting: AD_USE_TEST });
    initialized = true;
    // 🇪🇺 GDPR 동의 — 필요하면 AdMob 동의 창
    let info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) info = await AdMob.showConsentForm();
    canRequest = info.canRequestAds;
  } catch {
    /* 광고 초기화 실패는 치명적이지 않음 — 게임은 계속(보상은 그대로 지급) */
  }
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * 리워드 광고 → 끝까지 봤으면 true(보상 지급).
 * 웹·예전 앱·광고를 못 불러온 경우는 바로 보상(플레이를 막지 않음). 광고를 보다 닫으면 false.
 */
export async function showRewarded(placement = 'unknown'): Promise<boolean> {
  const ok = await showRewardedInner();
  track('ad_reward', { placement, ok, live: liveAds() && canRequest }); // 📊 광고 자리별 시청
  return ok;
}

async function showRewardedInner(): Promise<boolean> {
  if (!liveAds()) {
    await wait(500); // 웹·예전 앱: 광고 없음(보상은 바로 지급)
    return true;
  }
  await initAds();
  if (!canRequest) return true; // 동의 안 함/못 함 — 광고 없이 보상
  try {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
    let rewarded = false;
    const sub = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      rewarded = true;
    });
    try {
      await AdMob.prepareRewardVideoAd({ adId: AD_IDS.reward });
    } catch {
      await sub.remove();
      return true; // 광고 재고 없음 등 — 기다리게 하지 않고 보상
    }
    await AdMob.showRewardVideoAd();
    await sub.remove();
    return rewarded;
  } catch {
    return true;
  }
}

/** 💥 게임오버 전면 광고 — 자주 안 뜨게(3번 지면 1번 · 3분 간격 · 5관문 이후) */
let losses = 0;
let lastInter = 0;
export const INTER_EVERY = 3;
export const INTER_GAP_MS = 180_000;

export function shouldShowInterstitial(lossCount: number, clearedMax: number, now: number, last: number): boolean {
  return clearedMax >= 5 && lossCount > 0 && lossCount % INTER_EVERY === 0 && now - last >= INTER_GAP_MS;
}

export async function maybeInterstitial(clearedMax: number): Promise<void> {
  losses++;
  if (!liveAds() || !shouldShowInterstitial(losses, clearedMax, Date.now(), lastInter)) return;
  await initAds();
  if (!canRequest) return;
  try {
    const { AdMob } = await import('@capacitor-community/admob');
    await AdMob.prepareInterstitial({ adId: AD_IDS.inter });
    await AdMob.showInterstitial();
    lastInter = Date.now();
    track('ad_inter', { at: clearedMax });
  } catch {
    /* 못 불러오면 그냥 넘어감 */
  }
}
