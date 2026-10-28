/**
 * 📊 Firebase 애널리틱스 — 인지도·이탈 구간·광고 시청을 봄(출시는 광고만, 결제는 인기 확인 뒤).
 * 설치 앱(네이티브)에 플러그인이 있을 때만 보냄 — 웹·예전 앱(플러그인 없는 AAB)은 아무것도 안 함.
 * 이벤트 이름·값은 Firebase 규칙(영문 소문자·밑줄, 40자 이내)에 맞춤.
 */
type Params = Record<string, string | number | boolean>;

type Cap = { isNativePlatform?: () => boolean; isPluginAvailable?: (name: string) => boolean };

function cap(): Cap | undefined {
  return (globalThis as unknown as { Capacitor?: Cap }).Capacitor;
}

function available(): boolean {
  const c = cap();
  return !!c?.isNativePlatform?.() && !!c.isPluginAvailable?.('FirebaseAnalytics');
}

let plugin: Promise<typeof import('@capacitor-firebase/analytics').FirebaseAnalytics | null> | null = null;

function fa(): Promise<typeof import('@capacitor-firebase/analytics').FirebaseAnalytics | null> {
  if (!available()) return Promise.resolve(null);
  plugin ??= import('@capacitor-firebase/analytics').then((m) => m.FirebaseAnalytics).catch(() => null);
  return plugin;
}

/** 이벤트 보내기(실패해도 게임에는 영향 없음) */
export function track(name: string, params: Params = {}): void {
  void fa()
    .then((f) => f?.logEvent({ name, params }))
    .catch(() => undefined);
}

/** 사용자 속성(예: 깬 최고 관문) */
export function trackUser(key: string, value: string | number): void {
  void fa()
    .then((f) => f?.setUserProperty({ key, value: String(value) }))
    .catch(() => undefined);
}

/** 화면 이름(씬 바뀔 때) */
export function trackScreen(screenName: string): void {
  void fa()
    .then((f) => f?.setCurrentScreen({ screenName }))
    .catch(() => undefined);
}
