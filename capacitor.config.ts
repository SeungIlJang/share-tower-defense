import type { CapacitorConfig } from '@capacitor/cli';

// 테스트 트랙(비공개 테스트) AAB 는 ADS_TEST=1 을 걸고 빌드한다 → UA 에 MSAdsTest 가 붙고,
// games 레포의 게임 코드가 그 토큰을 보고 구글 테스트 광고만 띄운다. 테스터가 광고를 눌러도
// 계정에 영향이 없다. OTA 라 테스트 트랙과 프로덕션이 같은 HTML 을 받으므로, AAB 마다 달라질
// 수 있는 신호는 UA 뿐이다. (2026-11-02 무효 트래픽으로 29일 정지된 뒤 도입)
// @types/node 를 globals 로 켜지 않으려고 process 를 좁게 선언해서 읽는다.
const adsTest =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.ADS_TEST === '1';

const config: CapacitorConfig = {
  appId: 'com.moduseries.linedefense',
  appName: '모두의 타워디펜스',
  webDir: 'dist',
  // OTA: 앱은 아래 라이브 URL을 불러옴 → 게임 수정은 games 레포 푸시로 즉시 반영(재업로드 불필요)
  server: { url: 'https://seungiljang.github.io/games/linedefense/', androidScheme: 'https' },
  android: { backgroundColor: '#0d1018' },
  // 전체화면 빌드 표시(웹이 상태바 여백을 안 줌) · 실제 AdMob 앱 ID 빌드 표시(웹이 광고를 켬)
  // · MSAdsTest 가 붙으면 광고는 켜되 구글 테스트 유닛을 쓴다
  appendUserAgent: `LDImmersive LDAds${adsTest ? ' MSAdsTest' : ''}`,
  plugins: {
    // Capacitor 8 기본 SystemBars가 시작할 때 상태바·내비게이션바를 다시 보이게 함 → 숨김 고정, 여백(패딩)도 안 줌
    SystemBars: { hidden: true, insetsHandling: 'disable' },
  },
};

export default config;
