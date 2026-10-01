import "dotenv/config";
import type { ExpoConfig } from "expo/config";

// 공유 패키지는 환경변수를 직접 읽지 않는다.
// 여기서 읽어 extra 로 넘기고 앱 진입점에서 initApi() 로 주입한다.
const config: ExpoConfig = {
  name: "Waylog",
  slug: "waylog",
  // EAS 프로젝트가 @ehgus6887/waylog 이다. 없으면 eas 명령이
  // 현재 로그인 계정 기준으로 다른 프로젝트를 찾는다.
  owner: "ehgus6887",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "me.waylog.app",
    usesAppleSignIn: true,
    config: { googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
    /** 플랜 등록 후 주석 해제 */
    // associatedDomains: ["applinks:waylog.me", "applinks:www.waylog.me"],
    icon: "./assets/logo.png",
  },
  android: {
    package: "me.waylog.app",
    config: {
      googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY },
    },
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/logo.png",
      backgroundImage: "./assets/logo.png",
      monochromeImage: "./assets/logo.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: "./assets/logo.png" },
  scheme: "waylog",
  runtimeVersion: { policy: "appVersion" },
  updates: {
    url: `https://u.expo.dev/${process.env.EXPO_PUBLIC_EAS_PROJECT_ID}`,
    checkAutomatically: "NEVER",
    fallbackToCacheTimeout: 0,
  },
  plugins: [
    // Expo mod 는 나중에 등록된 것이 먼저 실행된다. 다른 플러그인이 넣은
    // entitlement 를 지우려면 반드시 맨 앞에 둔다.
    "./plugins/withPersonalTeamSigning",
    "expo-web-browser",
    "expo-updates",
    "expo-apple-authentication",
    [
      "@rnmapbox/maps",
      {
        // v10+ 는 RNMapboxMapsDownloadToken 불필요. 런타임 access token은
        // Mapbox.setAccessToken() 호출로 별도 주입한다 (Task 2).
      },
    ],
    [
      "expo-font",
      {
        fonts: [
          "./assets/fonts/SUIT-Regular.ttf",
          "./assets/fonts/SUIT-Bold.ttf",
          "./assets/fonts/SUIT-Heavy.ttf",
        ],
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission: "지도에 내 위치를 표시하고 가까운 장소를 찾기 위해 위치를 사용합니다.",
        locationAlwaysAndWhenInUsePermission: "지도에 내 위치를 표시하고 가까운 장소를 찾기 위해 위치를 사용합니다.",
        locationAlwaysPermission: "지도에 내 위치를 표시하고 가까운 장소를 찾기 위해 위치를 사용합니다.",
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission: "게시물에 사진을 추가하기 위해 사진 보관함에 접근합니다.",
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-logo.png",
        imageWidth: 96,
        backgroundColor: "#ffffff",
      },
    ],
    // Xcode 27이 UIKit Scene lifecycle 미채택 앱을 크래시시킨다(EXC_BREAKPOINT).
    // 공식 패치(expo/config-plugins#326)가 npm엔 아직 배포되지 않아 워크스페이스
    // 패키지로 직접 들여왔다.
    "@config-plugins/expo-uiscene-lifecycle",
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    governmentApiServiceKey: process.env.EXPO_PUBLIC_DATA_GO_SERVICE_KEY,
    // Expo 가 앱을 식별하는 값이다. 없으면 getExpoPushTokenAsync 가
    // 토큰을 만들지 못해 푸시 구독이 통째로 꺼진다(`eas init` 로 얻는다).
    eas: { projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID },
    // eas update 를 게시할 때 BUNDLE_IS_MANDATORY=true 를 주면 받은 직후 재시작한다.
    isMandatory: process.env.BUNDLE_IS_MANDATORY === "true",
  },
};

export default config;
