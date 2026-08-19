import 'dotenv/config'
import type { ExpoConfig } from 'expo/config'

// 공유 패키지는 환경변수를 직접 읽지 않는다.
// 여기서 읽어 extra 로 넘기고 앱 진입점에서 initApi() 로 주입한다.
const config: ExpoConfig = {
  name: "waylog-app",
  slug: "waylog-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {"supportsTablet": true},
  android: {"adaptiveIcon": {"backgroundColor": "#E6F4FE", "foregroundImage": "./assets/android-icon-foreground.png", "backgroundImage": "./assets/android-icon-background.png", "monochromeImage": "./assets/android-icon-monochrome.png"}, "predictiveBackGestureEnabled": false},
  web: {"favicon": "./assets/favicon.png"},
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
}

export default config
