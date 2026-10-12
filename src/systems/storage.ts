/**
 * 저장 추상화 — 네이티브(Capacitor)는 @capacitor/preferences, 웹은 localStorage.
 * Capacitor 전역 감지로 패키지 정적 import 없이(테스트/웹 안전) 동작.
 */
function isNative(): boolean {
  const cap = (globalThis as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
}

export async function storageGet(key: string): Promise<string | null> {
  if (isNative()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key });
      return value ?? null;
    } catch {
      return null;
    }
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 저장(비동기 fire-and-forget) — 호출부는 동기 유지 */
export function storageSet(key: string, value: string): void {
  if (isNative()) {
    void import('@capacitor/preferences').then(({ Preferences }) => Preferences.set({ key, value }));
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}
