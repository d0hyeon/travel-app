// 이미지 에셋을 모듈로 임포트하면 Metro 가 번들 참조를 돌려준다.
// expo/types 가 선언하지 않아 앱에서 직접 둔다.
// expo-env.d.ts 는 Expo 가 재생성하는 gitignore 대상이라 여기에 둔다.
declare module '*.png' {
  import type { ImageSourcePropType } from 'react-native'
  const content: ImageSourcePropType
  export default content
}
