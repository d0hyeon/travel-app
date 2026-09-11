import "dotenv/config";
import type { ExpoConfig } from "expo/config";

// 공유 패키지는 환경변수를 직접 읽지 않는다.
// 여기서 읽어 extra 로 넘기고 앱 진입점에서 initApi() 로 주입한다.
const config: ExpoConfig = {
  name: "WayLog:me",
  slug: "waylog-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/logo.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "me.waylog.app",
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
  plugins: [
    "expo-router",
    "expo-web-browser",
    [
      "@rnmapbox/maps",
      {
        // v10+ 는 RNMapboxMapsDownloadToken 불필요. 런타임 access token은
        // Mapbox.setAccessToken() 호출로 별도 주입한다 (Task 2).
      },
    ],
    // expo-notifications 가 autolinking 으로 주입하는 aps-environment 를 걷어낸다.
    // 반드시 마지막에 둔다 — 앞선 플러그인이 넣은 뒤에 지워야 한다.
    "./plugins/withPersonalTeamSigning",
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    governmentApiServiceKey: process.env.EXPO_PUBLIC_DATA_GO_SERVICE_KEY,
  },
};

export default config;
