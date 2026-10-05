# 앱 인터페이스 플랫폼 의존성 동기화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 앱(`apps/waylog-app`)에 남아있는 웹 DOM 플랫폼 의존 인터페이스(`sx`, `onClick`, `component`)를 RN 표준 표현(`style`, `onPress`)으로 바꾸고, MUI 호환 shim 폴더를 자체 디자인 시스템으로 재명명한다.

**Architecture:** `shared/components/mui/`는 웹 화면을 복사해 오기 위한 MUI 호환 계층이었다. 이관이 끝난 지금은 호환 자체가 부채다 — RN 생태계 표준 표현(`style`/`onPress`)을 두고 웹 API 이름을 유지할 이유가 없다. 이 플랜은 (1) 디자인 시스템 어휘(`variant`, `color="text.secondary"`, spacing 8배수, `size`)는 **보존**하고, (2) 웹 런타임 때문에 존재하던 API 형태만 걷어낸다. `sxToStyle` 변환 계층이 사라지면서 그 안의 웹 전용 방어 코드(`DROPPED` 목록, `position:fixed`, `calc()`)도 함께 소멸한다.

**Tech Stack:** React Native 0.81.5, Expo SDK 54, TypeScript 5.9, vitest, `@emotion/native`

**Spec:** 이 문서에 인라인. 아래 "전수조사 결과"가 스펙 역할을 한다.

## Global Constraints

- **디자인 시스템 어휘는 절대 바꾸지 않는다.** `variant`(`h4`…`caption`, `contained|outlined|text`), `color="text.secondary"` 같은 토큰 문자열, `size`(`small|medium|large`), spacing 축약 prop(`mb`/`px`/`gap`)의 8배수 규칙은 전부 유지한다. 이들은 플랫폼 의존이 아니라 디자인 시스템 자산이다.
- **`onSubmit`은 유지한다.** 앱의 `onSubmit=` 16곳은 전부 자체 폼 컴포넌트의 콜백 prop(`(data) => void`)이며 DOM `<form onSubmit>` 이 아니다. 대상이 아니다.
- **죽은 코드는 제거하지 않는다.** 외부 참조 0건인 `shared/components/Button.tsx`, `Stack.tsx`, `tab-navigation/`, `AnimatedTabBar.tsx` 는 파일을 그대로 둔다. 단 이들도 `sx`/`onClick` 을 쓴다면 변환 대상에는 **포함**한다(해당: `AnimatedTabBar.tsx` 의 `sx` 1곳).
- **화면 렌더 결과가 바뀌면 안 된다.** 이 작업은 순수 인터페이스 개명이다. `sx={{ gap: 6 }}` → `style={{ gap: 6 }}` 처럼 값은 그대로 옮긴다. 예외는 `sx` 안에 MUI spacing 축약키를 쓴 8곳뿐이며, 여기서만 ×8 실측 변환이 일어난다(Task 3에 전량 명시).
- **경로 별칭은 `~` 로 시작한다.** 이번 작업에서 생기는 `design-system` 경로에만 우선 적용한다. 다른 경로는 건드리지 않는다.
- 검증 명령: 타입 `pnpm --filter waylog-app exec tsc --noEmit -p .`, 테스트 `pnpm --filter waylog-app test`

---

## 전수조사 결과 (스펙)

측정 시점 `fix/app-qa-batch-3`, 대상 `apps/waylog-app/src`.

### 제거 대상 — 웹 DOM 의존

| 항목 | 건수 | 근거 |
| --- | --- | --- |
| `sx={...}` | 427곳 / 104파일 | MUI 고유 API. RN 표준은 `style` |
| `sx?: Sx` prop 정의 | 23곳 (shim 17 + feature 6) | 위와 동일 |
| `onClick` | 150곳 (shim 정의 12 + 호출 138) | DOM 마우스 이벤트 이름. RN 표준은 `onPress` |
| `onClick?:` prop 정의 | 10곳 (shim 6 + feature 4) | 위와 동일 |
| `component="span"` | 6곳 (전부 `TripDDay.tsx`) | DOM 태그 지정용. shim 이 받고 무시 중 |
| `component?: string` 정의 | 1곳 (`Typography.tsx:40`) | 위와 동일 |
| `sx.ts` 전체 | 63줄 | 변환 계층. `DROPPED` 목록·`position:fixed`·`calc()` 방어 코드 포함 |

### 보존 대상 — 디자인 시스템 / 플랫폼 무관

- `variant` 체계, `color="text.secondary"` 토큰 매핑(`COLOR_MAP`), spacing 8배수, `size`, `fullWidth`, `loading`
- `onSubmit` 16곳 — 자체 폼 콜백
- `stopPropagation` 5곳 — RN `GestureResponderEvent` 에도 있는 정상 API
- `PropsWithAs`/`toComponent`/`as` prop — RN 컴포넌트 교체용(`as={Animated.View}`)이지 DOM 태그 지정이 아니다

### 확인된 부재 (조치 불필요)

`className`, `href`, `onMouseEnter/Down/Up`, `onKeyDown`, `preventDefault`, `document.*`, `window.*`, `boxShadow`, `cursor`, `userSelect`, `whiteSpace`, `textOverflow` — 전부 **0건**. 초기 grep 의 `cursor`/`whiteSpace` 히트는 `date-picker` 의 달력 커서 변수명과 `sx.ts` 의 차단 목록 문자열 오탐이었다.

### 전환 난이도를 가르는 사실

- `sx` 427곳 중 **419곳은 이미 실측 px** 이라 키 이름만 바꾸면 된다.
- MUI spacing 축약키를 `sx` 안에 쓴 곳은 **8곳뿐**이고 Task 3에 전량 나열되어 있다.
- `style` 은 이미 275곳에서 쓰이고 있어 표현이 낯설지 않다.
- `sx`/`style` 동시 사용 2곳은 서로 다른 엘리먼트라 실제 충돌이 아니다.

---

## File Structure

### 이동 (Task 1)

`shared/components/mui/` → `shared/components/design-system/`. 파일 구성은 그대로.

### 삭제 (Task 6)

- `shared/components/design-system/sx.ts` — `style` 전환 완료 후 소멸

### 신규

- 없음. 이 플랜은 순수 개명이다.

### 수정

| 파일군 | 태스크 | 책임 |
| --- | --- | --- |
| `tsconfig.json`, `vitest.config.ts` | 1 | `~/design-system` alias 해석 |
| `design-system/*.tsx` (19개) | 2 | shim 인터페이스 `sx`→`style`, `onClick`→`onPress` |
| `design-system/sx.ts` | 6 | 삭제 |
| `features/**`, `shared/components/**` 호출부 | 3·4 | prop 이름 치환 |
| `Sx` 타입을 직접 쓰는 feature 6곳 | 3 | `StyleProp<ViewStyle>` 로 교체 |
| `onClick` 을 자체 prop 으로 정의한 feature 4곳 | 4 | `onPress` 로 교체 |
| `Typography.tsx`, `TripDDay.tsx` | 5 | `component` prop 제거 |
| `docs/codebase.md` | 7 | 경로·패턴 갱신 |

### 의존 그래프 / 웨이브

```
Task 1 (폴더 이동 + alias)
   ↓
Task 2 (shim 인터페이스 전환)   ← 호출부보다 먼저. 타입이 호출부 오류를 드러낸다
   ↓
   ├─ Task 3 (sx → style 호출부)      ┐ 같은 파일을 만지므로
   └─ Task 4 (onClick → onPress 호출부)┘ 순차 실행. 병렬 금지
   ↓
Task 5 (component prop 제거)
   ↓
Task 6 (sx.ts 삭제)
   ↓
Task 7 (문서 갱신)
```

Task 3과 4는 `TripRoutesContent.tsx`·`ExpenseForm.tsx` 등 다수 파일이 겹치므로 **같은 웨이브에 넣지 않는다.** 전부 단일 웨이브 순차 실행이다.

---

## Task 1: 폴더 재명명과 `~` 경로 별칭

**Files:**
- Move: `apps/waylog-app/src/shared/components/mui/` → `apps/waylog-app/src/shared/components/design-system/`
- Modify: `apps/waylog-app/tsconfig.json`
- Modify: `apps/waylog-app/vitest.config.ts`
- Modify: 상대경로로 `components/mui` 를 임포트하는 101곳

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces: 이후 모든 태스크가 `~/shared/components/design-system` 경로로 임포트한다. `Sx` 타입도 당분간 이 경로에서 나온다(Task 6에서 소멸).

**배경:** 현재 임포트는 전부 상대경로이며 깊이가 제각각이다 — `'../../../shared/components/mui'` 66곳, `'../../shared/...'` 22곳, `'../../../../shared/...'` 11곳. 폴더를 옮기면 이 상대경로가 전부 깨지므로, 어차피 손대는 김에 alias 로 바꾼다. Expo SDK 54 의 Metro 는 tsconfig 의 `paths` 를 읽지만 vitest 는 읽지 않으므로 두 곳 모두 설정해야 한다.

- [ ] **Step 1: 폴더를 git mv 로 옮긴다**

```bash
cd /Users/kdh/space/dev/travel-app
git mv apps/waylog-app/src/shared/components/mui apps/waylog-app/src/shared/components/design-system
```

- [ ] **Step 2: tsconfig 에 paths 를 추가한다**

`apps/waylog-app/tsconfig.json` 전체를 아래로 교체한다. `expo/tsconfig.base` 에는 `paths` 가 없으므로 여기서 처음 정의하는 것이다. `baseUrl` 없이 `paths` 만 쓰면 tsconfig 위치 기준으로 해석된다.

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "~/shared/components/design-system": ["./src/shared/components/design-system/index.ts"],
      "~/shared/components/design-system/*": ["./src/shared/components/design-system/*"]
    }
  }
}
```

- [ ] **Step 3: vitest 에 같은 alias 를 추가한다**

`apps/waylog-app/vitest.config.ts` 전체를 아래로 교체한다. vitest 는 tsconfig `paths` 를 자동으로 읽지 않으므로 별도 선언이 필요하다.

```ts
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      '~/shared/components/design-system': path.resolve(
        __dirname,
        'src/shared/components/design-system',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
```

- [ ] **Step 4: 임포트 경로를 일괄 치환한다**

깊이가 다른 상대경로 3종을 모두 하나의 alias 로 모은다. 세미콜론이 붙은 변형(2곳)도 같은 패턴에 걸린다.

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
grep -rl "shared/components/mui" --include="*.tsx" --include="*.ts" . \
  | xargs sed -i '' -E "s#'(\.\./)+shared/components/mui'#'~/shared/components/design-system'#g"
```

- [ ] **Step 5: 잔여 참조가 없는지 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
grep -rn "components/mui" --include="*.tsx" --include="*.ts" .
```

기대: 출력 없음. 무언가 남았다면 상대경로 형태가 위 정규식과 다른 것이므로 개별 수정한다.

- [ ] **Step 6: 타입 검사로 alias 해석을 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app exec tsc --noEmit -p .
```

기대: 에러 0건. `Cannot find module '~/shared/components/design-system'` 이 나오면 Step 2 의 `paths` 가 잘못된 것이다.

- [ ] **Step 7: 테스트가 여전히 통과하는지 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app test
```

기대: 기존과 동일하게 통과.

- [ ] **Step 8: 커밋**

폴더 이동과 alias 도입은 "디자인 시스템 경로를 자체 이름으로 세운다"는 하나의 목적이다.

```bash
cd /Users/kdh/space/dev/travel-app
git add -A apps/waylog-app
git commit -m "refactor(app): mui 호환 계층을 design-system 으로 옮기고 ~ 별칭을 도입한다

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: 디자인 시스템 컴포넌트의 인터페이스를 RN 표준으로 바꾼다

**Files:**
- Modify: `src/shared/components/design-system/` 아래 `sx` 또는 `onClick` 을 prop 으로 받는 전체 — `Box.tsx`, `Stack.tsx`, `Typography.tsx`, `Button.tsx`, `IconButton.tsx`, `Fab.tsx`, `Chip.tsx`, `Avatar.tsx`, `Badge.tsx`, `Checkbox.tsx`, `Divider.tsx`, `Skeleton.tsx`, `Tabs.tsx`, `TextField.tsx`, `TextOverlayField.tsx`, `ToggleButtonGroup.tsx`, `LinearProgress.tsx`

**Interfaces:**
- Consumes: Task 1 의 `~/shared/components/design-system` 경로
- Produces: 이후 호출부가 의존하는 prop 이름.
  - `style?: StyleProp<ViewStyle>` (텍스트 계열은 `StyleProp<TextStyle>`) — 기존 `sx?: Sx` 자리
  - `onPress?: () => void` — 기존 `onClick?: () => void` 자리
  - 디자인 시스템 어휘(`variant`/`color`/`size`/`mb`/`px`/`gap`/`fullWidth`/`loading`)는 **시그니처 변화 없음**

**배경:** 호출부보다 shim 을 먼저 바꾼다. 그래야 `tsc` 가 아직 안 고친 호출부를 전부 에러로 짚어주고, 이것이 Task 3·4 의 작업 목록이 된다. 반대 순서면 중간 상태에서 타입이 통과해 누락을 놓친다.

`sxToStyle(sx)` 를 걷어내는 자리에는 그냥 `style` 을 배열 끝에 놓는다. RN 의 style 배열은 뒤가 이기므로 `sx` 가 마지막에 병합되던 우선순위가 그대로 보존된다.

- [ ] **Step 1: `Box.tsx` 를 바꾼다**

`sx` 를 없애고 `ViewProps` 가 이미 제공하는 `style` 을 쓴다. `BoxProps` 는 `ViewProps` 를 상속하므로 `style` 은 이미 타입에 있다 — 별도 선언이 필요 없다.

```tsx
import type { ReactNode } from 'react'
import { View, type ViewProps, type ViewStyle } from 'react-native'

// 웹 코드를 그대로 붙여넣기 위해 MUI 와 같은 이름·prop 을 유지한다.
export interface BoxProps extends ViewProps {
  /** MUI 축약 prop */
  width?: number | string
  height?: number | string
  flex?: number
  minWidth?: number | string
  overflow?: string
  position?: 'absolute' | 'relative'
  textAlign?: 'left' | 'center' | 'right'
  children?: ReactNode
}

export function Box({
  style,
  width,
  height,
  flex,
  minWidth,
  overflow: _overflow,
  position,
  textAlign,
  ...rest
}: BoxProps) {
  return (
    <View
      style={[{ width, height, flex, minWidth, position, alignItems: textAlign === 'center' ? 'center' : undefined } as ViewStyle, style]}
      {...rest}
    />
  )
}
```

첫 줄 주석은 더 이상 사실이 아니므로 지운다. 위 코드에 이미 반영되어 있다.

- [ ] **Step 2: `Stack.tsx` 를 바꾼다**

`sx` 만 걷어내고 spacing 축약 prop(`mb`/`px`/`gap`/`spacing`)의 8배수는 그대로 둔다.

```tsx
import type { ElementType, ReactNode } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'
import { PropsWithAs } from './typings'

export interface StackProps {
  style?: StyleProp<ViewStyle>
  width?: number | string
  flex?: number
  flexWrap?: 'wrap' | 'nowrap'
  useFlexGap?: boolean
  minWidth?: number | string
  mb?: number
  mt?: number
  ml?: number
  mr?: number
  px?: number
  py?: number
  p?: number
  /** MUI 와 같이 1 = 8px 이다 */
  spacing?: number
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline'
  justifyContent?:
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  gap?: number
  children?: ReactNode
}

export function Stack<As extends ElementType = typeof View>({
  style,
  spacing,
  direction = 'column',
  alignItems,
  justifyContent,
  gap,
  width,
  flex,
  flexWrap,
  useFlexGap: _useFlexGap,
  minWidth,
  mb,
  mt,
  ml,
  mr,
  px,
  py,
  p,
  as,
  ...rest
}: PropsWithAs<StackProps, As>) {
  const Component = as ?? View

  return (
    <Component
      style={[
        {
          flexDirection: direction,
          alignItems,
          justifyContent,
          gap: gap != null ? gap * 8 : spacing != null ? spacing * 8 : undefined,
          width,
          flex,
          flexWrap,
          minWidth,
          marginBottom: mb != null ? mb * 8 : undefined,
          marginTop: mt != null ? mt * 8 : undefined,
          marginLeft: ml != null ? ml * 8 : undefined,
          marginRight: mr != null ? mr * 8 : undefined,
          paddingHorizontal: px != null ? px * 8 : undefined,
          paddingVertical: py != null ? py * 8 : undefined,
          padding: p != null ? p * 8 : undefined,
        } as ViewStyle,
        style,
      ]}
      {...rest}
    />
  )
}
```

`toComponent` 임포트는 원래도 쓰이지 않았으므로 함께 지운다(위 코드에 반영됨).

- [ ] **Step 3: `Typography.tsx` 를 바꾼다**

`sx` 를 없앤다. `component` prop 은 Task 5 에서 다루므로 **여기서는 남겨둔다** — 지금 지우면 `TripDDay.tsx` 6곳이 동시에 깨져 태스크 경계가 무너진다. `COLOR_MAP` 과 `VARIANT_STYLE` 은 디자인 시스템 어휘이므로 손대지 않는다.

`sx?: Sx` 줄을 `style` 로 바꾸되, `TypographyProps` 는 `RNTextProps` 를 상속하므로 `style` 은 이미 타입에 있다. 따라서 `sx` 관련 줄만 지우면 된다.

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src/shared/components/design-system
```

`Typography.tsx` 에서 다음 4곳을 수정한다.

1. 임포트에서 `sxToStyle`/`Sx` 제거:

```tsx
import type { ReactNode } from 'react'
import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { palette } from '../../config/tokens'
```

2. `TypographyProps` 에서 `sx?: Sx` 줄 삭제
3. 구조분해에서 `sx,` 삭제
4. style 배열에서 `sxToStyle(sx),` 삭제 — 그 자리 바로 뒤의 `style` 이 이미 마지막에 있으므로 우선순위가 유지된다

- [ ] **Step 4: `Button.tsx` 를 바꾼다**

`onClick` → `onPress`, `sx` → `style`, `textSx` → `textStyle`. `variant`/`size`/`color`/`fullWidth`/`loading` 은 디자인 시스템 어휘라 그대로다.

```tsx
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { palette, radius } from '../../config/tokens'
import { Typography } from './Typography'

// 웹 theme.ts 의 MuiButton size variant 를 모바일 수치로 옮긴다.
const SIZE = {
  small: { height: 24, borderRadius: radius.sm, fontSize: 11, paddingHorizontal: 8 },
  medium: { height: 32, borderRadius: radius.md, fontSize: 13, paddingHorizontal: 12 },
  large: { height: 40, borderRadius: radius.lg, fontSize: 14, paddingHorizontal: 16 },
} as const

const LOADER_GAP = 6

export interface ButtonProps {
  children?: ReactNode
  variant?: 'contained' | 'outlined' | 'text'
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'error' | 'inherit'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  startIcon?: ReactNode
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  /** 라벨 텍스트에만 적용한다. style 은 컨테이너로 간다. */
  textStyle?: StyleProp<TextStyle>
}

export function Button({
  children,
  variant = 'text',
  size = 'medium',
  color = 'primary',
  disabled,
  loading,
  fullWidth,
  startIcon,
  onPress,
  style,
  textStyle,
}: ButtonProps) {
  const dims = SIZE[size]
  const main = color === 'error' ? palette.error : palette.primary
  const isInactive = disabled === true || loading === true
  const textColor = variant === 'contained' ? '#fff' : main

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isInactive ? 0.4 : 1, { duration: 200 }),
  }))

  const loaderSize = dims.fontSize
  const animatedLoaderStyle = useAnimatedStyle(() => ({
    opacity: withTiming(loading === true ? 1 : 0, { duration: 200 }),
    width: withTiming(loading === true ? loaderSize + LOADER_GAP : 0, { duration: 200 }),
  }))

  return (
    <AnimatedPressable
      onPress={isInactive ? undefined : onPress}
      style={[
        {
          height: dims.height,
          borderRadius: dims.borderRadius,
          paddingHorizontal: dims.paddingHorizontal,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: variant === 'contained' ? main : 'transparent',
          borderWidth: variant === 'outlined' ? 1 : 0,
          borderColor: main,
          // 부모가 row 면 alignSelf 는 세로 정렬이라 너비가 늘지 않는다.
          // 주축을 채우려면 flex 로 늘린다. 다만 stretch 를 함께 주면
          // 교차축까지 늘어나 지정한 height 를 넘겨 버린다.
          ...(fullWidth ? { flex: 1, alignSelf: 'center' } : { alignSelf: 'flex-start' }),
        },
        animatedContainerStyle,
        style,
      ]}
    >
      {startIcon}
      <Animated.View style={[{ overflow: 'hidden', alignItems: 'center' }, animatedLoaderStyle]}>
        <ActivityIndicator size="small" color={textColor} />
      </Animated.View>
      <Typography
        style={[
          { fontSize: dims.fontSize, fontWeight: '900', color: textColor },
          textStyle,
        ]}
      >
        {children}
      </Typography>
    </AnimatedPressable>
  )
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
```

- [ ] **Step 5: `IconButton.tsx` 와 `Fab.tsx` 를 바꾼다**

두 파일 모두 `onClick` → `onPress`, `sx` → `style` 로 같은 형태다.

`IconButton.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'

export interface IconButtonProps {
  children?: ReactNode
  onPress?: () => void
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

export function IconButton({ children, onPress, size = 'medium', disabled, style }: IconButtonProps) {
  const box = size === 'small' ? 28 : size === 'large' ? 44 : 36

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[
        {
          width: box,
          height: box,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: box / 2,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}
```

`Fab.tsx`:

```tsx
import type { ReactNode } from 'react'
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { palette } from '../../config/tokens'

export interface FabProps {
  children?: ReactNode
  onPress?: () => void
  color?: 'primary' | 'default'
  size?: 'small' | 'medium' | 'large'
  style?: StyleProp<ViewStyle>
}

export function Fab({ children, onPress, color = 'primary', size = 'medium', style }: FabProps) {
  const box = size === 'small' ? 40 : size === 'large' ? 64 : 56

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color === 'primary' ? palette.primary : '#fff',
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  )
}
```

- [ ] **Step 6: `Chip.tsx` 를 바꾼다**

`onClick` → `onPress`, `sx` → `style`. 이 파일은 `sx` 를 `Box` 에 스프레드로 병합하고 있었는데(`...(sx ?? {})`), `style` 배열로 바꾼다.

```tsx
import { Pressable, type StyleProp, type ViewStyle } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { palette } from '../../config/tokens'
import { Box } from './Box'
import { Typography } from './Typography'

export interface ChipProps {
  label: string
  size?: 'small' | 'medium'
  variant?: 'filled' | 'outlined'
  color?: 'primary' | 'default'
  onPress?: () => void
  onDelete?: () => void
  style?: StyleProp<ViewStyle>
}

export function Chip({
  label,
  size = 'medium',
  variant = 'filled',
  color = 'default',
  onPress,
  onDelete,
  style,
}: ChipProps) {
  const isPrimary = color === 'primary'
  const filled = variant === 'filled'

  return (
    <Pressable onPress={onPress}>
      <Box
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: size === 'small' ? 8 : 12,
            paddingVertical: size === 'small' ? 3 : 6,
            borderRadius: 12,
            borderWidth: filled ? 0 : 1,
            borderColor: isPrimary ? palette.primary : palette.divider,
            backgroundColor: filled
              ? isPrimary
                ? palette.primary
                : 'rgba(0,0,0,0.08)'
              : 'transparent',
            alignSelf: 'flex-start',
          },
          style,
        ]}
      >
        <Typography
          style={{
            fontSize: size === 'small' ? 11 : 13,
            color: filled && isPrimary ? '#fff' : palette.text,
          }}
        >
          {label}
        </Typography>
        {onDelete != null && (
          <Pressable onPress={onDelete} hitSlop={8}>
            <MaterialIcons
              name="close"
              size={14}
              color={filled && isPrimary ? '#fff' : palette.textSecondary}
            />
          </Pressable>
        )}
      </Box>
    </Pressable>
  )
}
```

- [ ] **Step 7: 나머지 컴포넌트의 `sx` 를 `style` 로 바꾼다**

대상: `Avatar.tsx`, `Badge.tsx`, `Checkbox.tsx`, `Divider.tsx`, `Skeleton.tsx`, `Tabs.tsx`, `TextField.tsx`, `TextOverlayField.tsx`, `ToggleButtonGroup.tsx`, `LinearProgress.tsx`

각 파일에서 기계적으로 같은 4가지를 한다.

1. `import { sxToStyle, type Sx } from './sx'` 또는 `import type { Sx } from './sx'` 줄 삭제
2. props 인터페이스의 `sx?: Sx` → `style?: StyleProp<ViewStyle>` (텍스트 전용이면 `TextStyle`). `react-native` 임포트에 `type StyleProp, type ViewStyle` 추가
3. 구조분해 `sx` → `style`
4. 사용부 변환:
   - `sxToStyle(sx)` 가 style 배열 안에 있던 자리 → `style`
   - `...(sx ?? {})` 로 객체에 스프레드하던 자리 → 그 객체를 배열의 첫 원소로 두고 `style` 을 두 번째 원소로 옮긴다. 예: `sx={{ a: 1, ...(sx ?? {}) }}` → `style={[{ a: 1 }, style]}`
   - `...sxToStyle(sx)` 로 객체에 펼치던 자리(`Tabs.tsx:85`) → 같은 방식으로 배열화

`Avatar.tsx` 는 `const style = sxToStyle(sx)` 라는 지역 변수가 이미 있으므로(18행) prop 이름과 충돌한다. 지역 변수를 지우고 그 사용처를 prop `style` 로 대체한다.

- [ ] **Step 8: 타입 검사로 호출부 오류 목록을 얻는다**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | head -60
```

기대: **에러가 다수 발생한다.** 아직 호출부를 안 고쳤으므로 정상이다. 이 목록이 Task 3·4 의 대상이다. 단 여기 나오는 에러는 전부 `sx`/`onClick`/`textSx` 관련이어야 한다. 그 외 에러(예: 오타로 인한 `Cannot find name`)가 있으면 이 태스크의 실수이므로 먼저 고친다.

- [ ] **Step 9: 커밋**

호출부가 아직 안 고쳐져 타입 에러가 남은 상태지만, 이 커밋의 목적("디자인 시스템 인터페이스를 RN 표준으로 바꾼다")은 그 자체로 완결이다. 다음 태스크와 합치면 400곳 넘는 변경이 한 커밋이 되어 리뷰가 불가능해진다.

```bash
cd /Users/kdh/space/dev/travel-app
git add apps/waylog-app/src/shared/components/design-system
git commit -m "refactor(app): 디자인 시스템 인터페이스를 style·onPress 로 바꾼다

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: 호출부의 `sx` 를 `style` 로 바꾼다

**Files:**
- Modify: `sx={` 를 쓰는 104파일 (Task 2 의 shim 17파일을 제외하면 87파일)
- Modify: `Sx` 타입을 직접 임포트하는 feature 6곳 — `features/trip/trip-chat/TripUnreadCountBadge.tsx:10`, `features/trip/trip-chat/ChatPushNoticeCard.tsx:10`, `features/weather/DailyWeatherInfoBox.tsx:11,50`, `features/trip/trip-member/MemberAvatar.tsx:10`, `shared/components/notification-card/NotificationCard.tsx:12`, `shared/components/Map/NativeMap.tsx:29,47`
- Modify: `shared/components/` 의 비-design-system 컴포넌트 — `ListItem.tsx`(9), `bottom-sheet/BottomSheet.tsx`(3), `dnd/SortableList.tsx`(3), `MultiSelectDropdown.tsx`(3), `action-sheet/ActionSheet.tsx`(4), `MapConfigDialog.tsx`(2), `EditableText.tsx`(2), `CommonErrorBoundary.tsx`(2), `date-picker/TimeStepHeader.tsx`(1), `date-picker/CalendarHeader.tsx`(1), `confirm-dialog/ConfirmDialog.tsx`(1), `PopMenu.tsx`(1), `Map/NativeMapTooltip.tsx`(1), `Map/NativeMapMarker.tsx`(1), `BottomArea.tsx`(1), `AnimatedTabBar.tsx`(1)

**Interfaces:**
- Consumes: Task 2 가 만든 `style?: StyleProp<ViewStyle>` prop
- Produces: `Sx` 타입 참조가 코드베이스에서 사라진다 → Task 6 이 `sx.ts` 를 지울 수 있게 된다

**배경:** 427곳 중 419곳은 이미 실측 px 이라 키 이름만 바꾸면 된다. 값 변환이 필요한 8곳은 Step 2 에 전량 나열되어 있다. `sx` 는 스프레드 병합(`...(sx ?? {})`)을, `style` 은 배열 병합을 쓴다는 점만 주의한다.

- [ ] **Step 1: MUI spacing 축약키를 쓰는 8곳을 먼저 실측 px 로 바꾼다**

이 8곳은 단순 이름 치환으로 처리하면 값이 8배 틀어진다. 반드시 먼저 손으로 고친다.

| 파일:행 | 변경 전 | 변경 후 |
| --- | --- | --- |
| `features/trip/trip-place/TripPlaceItemButton.tsx:64` | `sx={{ flexWrap: 'wrap', mt: 0.5 }}` | `style={{ flexWrap: 'wrap', marginTop: 4 }}` |
| `features/trip/trip-weather/TripWeatherForecastSheet.tsx:91` | `sx={{ px: 0 }}` | `style={{ paddingHorizontal: 0 }}` |
| `features/trip/trip-basic-info/TripDDay.tsx:111` | `sx={{ mx: 0.5 }}` | `style={{ marginHorizontal: 4 }}` |
| `features/trip/trip-basic-info/TripDDay.tsx:138` | `sx={{ mx: 0.5 }}` | `style={{ marginHorizontal: 4 }}` |
| `features/trip/trip-basic-info/TripDDay.tsx:201` | `sx={{ ml: 0.5, ...numStyle }}` | `style={[{ marginLeft: 4 }, numStyle]}` |
| `shared/components/date-picker/TimeStepHeader.tsx:17` | `sx={{ px: 1, py: 1, gap: 1 }}` | `style={{ paddingHorizontal: 8, paddingVertical: 8, gap: 8 }}` |
| `shared/components/date-picker/CalendarHeader.tsx:14` | `sx={{ px: 1, py: 1 }}` | `style={{ paddingHorizontal: 8, paddingVertical: 8 }}` |
| `shared/components/bottom-sheet/BottomSheet.tsx:438` | `sx={{ px: 2, py: 1, ...(sx ?? {}) }}` | `style={[{ paddingHorizontal: 16, paddingVertical: 8 }, style]}` |

`TimeStepHeader.tsx:17` 과 `CalendarHeader.tsx:14` 의 `gap: 1` 은 `sx` 안에 있으므로 8px 이다. `Stack` 의 `gap={1}` prop 과 혼동하지 않는다 — 그쪽은 Task 2 에서 8배수가 유지됐다.

- [ ] **Step 2: 8곳이 제대로 바뀌었는지 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
grep -rnE "sx=\{\{[^}]*\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr):" --include="*.tsx" .
```

기대: 출력 없음. 남아있으면 Step 1 을 놓친 것이다.

- [ ] **Step 3: 스프레드 병합 패턴을 배열로 바꾼다**

`...(sx ?? {})` 는 단순 이름 치환으로 처리할 수 없다. 아래 4곳을 손으로 고친다(`BottomSheet.tsx:438` 은 Step 1 에서 이미 처리됨).

| 파일:행 | 변경 전 | 변경 후 |
| --- | --- | --- |
| `shared/components/dnd/SortableList.tsx:174` | `<Box sx={{ alignItems: 'center', ...(sx ?? {}) }}>` | `<Box style={[{ alignItems: 'center' }, style]}>` |
| `shared/components/dnd/SortableList.tsx:189` | `<Box sx={{ flex: 1, justifyContent: 'center', alignItems: 'center', ...(sx ?? {}) }}>` | `<Box style={[{ flex: 1, justifyContent: 'center', alignItems: 'center' }, style]}>` |
| `shared/components/bottom-sheet/BottomSheet.tsx:458` | `<Box sx={{ flex: 1, ...(sx ?? {}) }} {...props}>` | `<Box style={[{ flex: 1 }, style]} {...props}>` |
| `shared/components/design-system/TextOverlayField.tsx:32-36` | `sx={{ ...일부..., ...sx }}` | `style={[{ ...일부... }, style]}` |

각 파일의 props 정의에서 `sx?: Sx` → `style?: StyleProp<ViewStyle>` 로 바꾸고 구조분해 이름도 함께 바꾼다.

- [ ] **Step 4: `Sx` 타입을 직접 쓰는 feature 6곳을 바꾼다**

각 파일에서 `import type { Sx } from '...'` 을 지우고 `import type { StyleProp, ViewStyle } from 'react-native'` 를 추가한 뒤, `sx?: Sx` → `style?: StyleProp<ViewStyle>` 로 바꾼다. 전달부도 `sx={...}` → `style={...}` 로 바꾼다.

- `features/trip/trip-chat/TripUnreadCountBadge.tsx:10`
- `features/trip/trip-chat/ChatPushNoticeCard.tsx:10`
- `features/weather/DailyWeatherInfoBox.tsx:11` 및 `:50` — `function Pending({ sx }: { sx?: Sx })` → `function Pending({ style }: { style?: StyleProp<ViewStyle> })`. 호출부 `<Pending sx={props.sx} />`(16행) → `<Pending style={props.style} />`
- `features/trip/trip-member/MemberAvatar.tsx:10`
- `shared/components/notification-card/NotificationCard.tsx:12`
- `shared/components/Map/NativeMap.tsx:29,47` — `MapProps & { sx?: Sx }` → `MapProps & { style?: StyleProp<ViewStyle> }`

- [ ] **Step 5: 남은 단순 케이스를 일괄 치환한다**

여기까지 왔으면 남은 `sx=` 는 전부 실측 px 객체 리터럴이거나 변수 참조다. 키 이름만 바꾸면 된다.

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
grep -rl "sx=" --include="*.tsx" . | xargs sed -i '' 's/\bsx=/style=/g'
```

`Button` 의 `textSx` 도 함께 바꾼다.

```bash
grep -rl "textSx=" --include="*.tsx" . | xargs sed -i '' 's/\btextSx=/textStyle=/g'
```

- [ ] **Step 6: `sx` 잔재가 없는지 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
echo "-- sx= 잔여 --"; grep -rn "\bsx=" --include="*.tsx" --include="*.ts" .
echo "-- Sx 타입 잔여(sx.ts 자신 제외) --"; grep -rn "\bSx\b" --include="*.tsx" --include="*.ts" . | grep -v "design-system/sx.ts"
echo "-- sxToStyle 잔여 --"; grep -rn "sxToStyle" --include="*.tsx" --include="*.ts" . | grep -v "design-system/sx.ts"
```

기대: 세 줄 모두 출력 없음.

- [ ] **Step 7: 타입 검사**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | grep -E "error TS" | head -40
```

기대: `sx` 관련 에러 0건. `onClick` 관련 에러는 **아직 남아있다** — Task 4 의 몫이다.

에러가 남았다면 `style` 배열 안에 객체가 아닌 값이 들어갔거나(예: `false` 대신 `undefined` 필요), 텍스트 컴포넌트에 `ViewStyle` 을 준 경우다. 해당 컴포넌트의 `StyleProp<TextStyle>` 여부를 확인한다.

- [ ] **Step 8: 커밋**

```bash
cd /Users/kdh/space/dev/travel-app
git add apps/waylog-app/src
git commit -m "refactor(app): sx prop 을 RN style 로 바꾼다

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: 호출부의 `onClick` 을 `onPress` 로 바꾼다

**Files:**
- Modify: `onClick` 을 자체 prop 으로 정의한 feature 4곳 — `features/trip/trip-recommend/RecommendedMarkers.tsx:8`, `features/trip/trip-recommend/RecommendedPlaceListSection.tsx:54`, `features/trip/trip-place/trip-place-form/PlaceTitleButton.tsx:9`, `features/trip/trip-community-routes/CommunityRoutesSection.tsx:57`
- Modify: `shared/components/ListItem.tsx:69`, `shared/components/action-sheet/ActionSheet.tsx:81`
- Modify: `onClick=` 을 전달하는 나머지 호출부 전체

**Interfaces:**
- Consumes: Task 2 가 만든 `onPress?: () => void` prop
- Produces: `onClick` 이 코드베이스에서 사라진다. `onSubmit` 은 그대로 남는다.

**배경:** `onClick` 150건 중 shim 정의 12건은 Task 2 에서 처리됐다. 남은 138건이 대상이다. 이 중 6건은 자체 컴포넌트가 `onClick` 을 prop 으로 재정의한 것이라 정의와 호출을 함께 바꿔야 한다.

주의: `RecommendedMarkers.tsx:8` 의 `onClick?: (place: RecommendedPlace) => void` 는 인자를 받는다. 이름만 바꾸고 시그니처는 유지한다.

- [ ] **Step 1: 자체 prop 정의 6곳을 바꾼다**

각 파일에서 정의와 구조분해, 내부 사용처를 모두 `onPress` 로 바꾼다.

| 파일:행 | 변경 전 | 변경 후 |
| --- | --- | --- |
| `features/trip/trip-recommend/RecommendedMarkers.tsx:8` | `onClick?: (place: RecommendedPlace) => void` | `onPress?: (place: RecommendedPlace) => void` |
| `features/trip/trip-recommend/RecommendedPlaceListSection.tsx:54` | `onClick: () => void` | `onPress: () => void` |
| `features/trip/trip-place/trip-place-form/PlaceTitleButton.tsx:9` | `onClick: () => void` | `onPress: () => void` |
| `features/trip/trip-community-routes/CommunityRoutesSection.tsx:57` | `{ trip: CommunityTrip; onClick: () => void }` | `{ trip: CommunityTrip; onPress: () => void }` |
| `shared/components/ListItem.tsx:69` | `onClick?: () => void` | `onPress?: () => void` |
| `shared/components/action-sheet/ActionSheet.tsx:81` | `onClick?: () => void` | `onPress?: () => void` |

- [ ] **Step 2: 남은 `onClick` 을 일괄 치환한다**

`onClick` 은 `onSubmit` 과 달리 부분 문자열 충돌이 없다. 단어 경계로 안전하게 치환된다.

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
grep -rl "onClick" --include="*.tsx" --include="*.ts" . | xargs sed -i '' 's/\bonClick\b/onPress/g'
```

- [ ] **Step 3: `onClick` 이 완전히 사라졌는지, `onSubmit` 은 그대로인지 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
echo "-- onClick 잔여 (0이어야 함) --"; grep -rn "onClick" --include="*.tsx" --include="*.ts" . | wc -l
echo "-- onSubmit= (16이어야 함) --"; grep -rn "onSubmit=" --include="*.tsx" . | wc -l
```

기대: 첫 줄 `0`, 둘째 줄 `16`. `onSubmit` 이 16이 아니면 치환이 과했으므로 되돌린다.

- [ ] **Step 4: 타입 검사**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app exec tsc --noEmit -p . 2>&1 | grep -E "error TS" | head -40
```

기대: 에러 0건. Task 2·3·4 를 거치며 인터페이스와 호출부가 모두 정렬됐으므로 여기서 처음으로 깨끗해진다.

`Pressable` 이 아닌 곳에 `onPress` 를 준 경우가 있다면(예: `View`) 그 자리는 원래 `onClick` 이 아무 동작도 안 하던 죽은 prop 이다. 지운다.

- [ ] **Step 5: 테스트**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app test
```

기대: 통과. 기존 테스트는 `NativeMapCluster.utils` 등 순수 로직 대상이라 이번 변경과 무관하지만, 회귀가 없음을 확인한다.

- [ ] **Step 6: 커밋**

```bash
cd /Users/kdh/space/dev/travel-app
git add apps/waylog-app/src
git commit -m "refactor(app): onClick prop 을 RN onPress 로 바꾼다

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: `component` prop 을 제거한다

**Files:**
- Modify: `src/shared/components/design-system/Typography.tsx:40` (정의), 구조분해의 `component: _component`
- Modify: `src/features/trip/trip-basic-info/TripDDay.tsx` — `component="span"` 6곳 (107, 134, 186, 191, 196, 201행)

**Interfaces:**
- Consumes: Task 2·3 이 정리한 `Typography` 인터페이스
- Produces: `TypographyProps` 에서 `component` 가 사라진다

**배경:** `component` 는 MUI 가 렌더링할 DOM 태그를 지정하는 prop 이다. RN 에는 `span` 이 없어 shim 이 받기만 하고 버리고 있었다(`component: _component`). 화면에 아무 영향이 없으므로 지우면 된다. RN 컴포넌트 교체가 필요한 자리는 이미 `as` prop 이 담당한다.

- [ ] **Step 1: `TripDDay.tsx` 에서 `component="span"` 을 지운다**

6곳 전부 해당 속성만 삭제한다. 같은 태그의 다른 속성(`variant`, `color`, `fontWeight`, `style`)은 건드리지 않는다.

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
sed -i '' 's/ component="span"//g; s/^\( *\)component="span"$//' features/trip/trip-basic-info/TripDDay.tsx
```

한 줄을 통째로 차지하던 형태(107, 134행)는 위 두 번째 패턴으로 빈 줄이 되므로, 빈 줄을 지운다.

```bash
sed -i '' '/^ *$/{ /./!d; }' features/trip/trip-basic-info/TripDDay.tsx
```

이 정리가 파일의 다른 빈 줄까지 지울 수 있으므로, 실행 후 `git diff` 로 의도한 6곳만 바뀌었는지 확인한다. 원치 않는 변경이 있으면 되돌리고 손으로 지운다.

- [ ] **Step 2: `Typography.tsx` 에서 `component` 를 지운다**

두 곳이다.

1. `TypographyProps` 에서 삭제:

```tsx
  /** 웹 코드를 그대로 옮기기 위해 받기만 하고 무시한다 */
  component?: string
```

2. 구조분해에서 `component: _component,` 줄 삭제

- [ ] **Step 3: `component` 가 사라졌는지 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
grep -rn "component=\|component?:" --include="*.tsx" --include="*.ts" .
```

기대: 출력 없음.

- [ ] **Step 4: 타입 검사**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app exec tsc --noEmit -p .
```

기대: 에러 0건.

- [ ] **Step 5: 커밋**

```bash
cd /Users/kdh/space/dev/travel-app
git add apps/waylog-app/src
git commit -m "refactor(app): DOM 태그 지정용 component prop 을 제거한다

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: `sx.ts` 변환 계층을 삭제한다

**Files:**
- Delete: `src/shared/components/design-system/sx.ts`
- Modify: `src/shared/components/design-system/index.ts` — `sxToStyle`/`Sx` export 2줄 삭제

**Interfaces:**
- Consumes: Task 3 이 `Sx` 참조를 전부 없앤 상태
- Produces: 웹 전용 방어 코드(`DROPPED` 목록, `position:fixed` 변환, `calc()` 경고, MUI spacing 자동 ×8)가 코드베이스에서 소멸

**배경:** `sx.ts` 는 웹 MUI 의 `sx` 값을 RN style 로 옮기기 위한 변환 계층이었다. `style` 을 직접 쓰게 된 지금은 존재 이유가 없다. 이 파일이 담고 있던 웹 전용 방어 로직이 함께 사라지는 것이 이번 작업의 실질적 성과다.

- [ ] **Step 1: 참조가 정말 없는지 다시 확인한다**

지우기 전에 확인한다.

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
grep -rn "from './sx'\|from '.*design-system/sx'\|sxToStyle\|\bSx\b" --include="*.tsx" --include="*.ts" . | grep -v "design-system/sx.ts"
```

기대: 출력 없음. 무언가 나오면 Task 3 이 덜 끝난 것이므로 그것부터 고친다.

- [ ] **Step 2: 파일을 지운다**

```bash
cd /Users/kdh/space/dev/travel-app
git rm apps/waylog-app/src/shared/components/design-system/sx.ts
```

- [ ] **Step 3: 배럴에서 export 를 지운다**

`src/shared/components/design-system/index.ts` 에서 아래 줄을 삭제한다.

```ts
export { sxToStyle } from './sx'
export type { Sx } from './sx'
```

- [ ] **Step 4: 타입 검사와 테스트**

```bash
cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app exec tsc --noEmit -p . && pnpm --filter waylog-app test
```

기대: 타입 에러 0건, 테스트 통과.

- [ ] **Step 5: 커밋**

```bash
cd /Users/kdh/space/dev/travel-app
git add -A apps/waylog-app/src/shared/components/design-system
git commit -m "refactor(app): 쓰이지 않는 sx 변환 계층을 제거한다

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 7: `docs/codebase.md` 를 갱신한다

**Files:**
- Modify: `docs/codebase.md`

**Interfaces:**
- Consumes: Task 1~6 의 결과
- Produces: 없음 (마지막 태스크)

**배경:** 현재 문서는 앱 UI 를 "MUI 호환 shim" 으로 설명하고 있다. 이번 작업으로 그 전제가 바뀌었으므로 문서가 코드와 어긋난다.

- [ ] **Step 1: 기술 스택 표의 앱 UI 줄을 고친다**

변경 전:

```markdown
| UI        | `@emotion/native` 자체 구축 + MUI 호환 shim       |
```

변경 후:

```markdown
| UI        | `@emotion/native` 자체 구축 + 자체 디자인 시스템   |
```

- [ ] **Step 2: shim 설명 문단을 고친다**

변경 전:

```markdown
앱 UI 는 웹 MUI 와 같은 인터페이스를 갖는 얇은 shim(`shared/components/mui/`)을 두어
웹 화면을 복사해 오고 컴포넌트만 바꾸는 방식으로 이관한다.
바텀시트·정렬 목록처럼 손이 많이 가는 것은 직접 구현한다 — 아래 "주요 패턴" 참조.
```

변경 후:

```markdown
앱 UI 는 `shared/components/design-system/` 의 자체 디자인 시스템을 쓴다.
디자인 어휘(`variant`, `color="text.secondary"`, spacing 8배수)는 웹 theme 에서 승계했지만
인터페이스는 RN 표준(`style`, `onPress`)이다. `~/shared/components/design-system` 별칭으로 임포트한다.
바텀시트·정렬 목록처럼 손이 많이 가는 것은 직접 구현한다 — 아래 "주요 패턴" 참조.
```

- [ ] **Step 3: 디렉토리 구조의 `mui/` 줄을 고친다**

변경 전:

```markdown
│   │   │   ├── mui/        # MUI 호환 계층 — 웹 코드를 그대로 옮기기 위함
```

변경 후:

```markdown
│   │   │   ├── design-system/ # 자체 디자인 시스템 — 웹 theme 어휘 + RN 표준 인터페이스
```

- [ ] **Step 4: 문서에 `mui` 잔재가 없는지 확인한다**

```bash
cd /Users/kdh/space/dev/travel-app
grep -n "mui\|MUI" docs/codebase.md
```

웹(`apps/waylog-web`)의 MUI 언급은 그대로 남아야 한다 — 웹은 실제로 Material-UI 7 을 쓴다. 앱 문맥의 `mui` 만 사라졌는지 확인한다.

- [ ] **Step 5: 커밋**

```bash
cd /Users/kdh/space/dev/travel-app
git add docs/codebase.md
git commit -m "docs: 앱 UI 계층을 디자인 시스템으로 갱신한다

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## 최종 검증

모든 태스크 완료 후 한 번에 확인한다.

```bash
cd /Users/kdh/space/dev/travel-app/apps/waylog-app/src
echo "-- 웹 의존 인터페이스 (전부 0이어야 함) --"
for p in "\bsx=" "\bSx\b" "sxToStyle" "onClick" "component=" "components/mui"; do
  printf "%-18s %s\n" "$p" "$(grep -rnE -- "$p" --include='*.tsx' --include='*.ts' . | wc -l)"
done
echo "-- 보존 대상 (onSubmit= 는 16이어야 함) --"
grep -rn "onSubmit=" --include="*.tsx" . | wc -l

cd /Users/kdh/space/dev/travel-app
pnpm --filter waylog-app exec tsc --noEmit -p . && pnpm --filter waylog-app test
```

타입·테스트가 통과해도 이 작업은 **UI 컴포넌트 변경**이라 컴포넌트 테스트 인프라가 없다. `CLAUDE.md` 의 규칙대로 실제 앱을 띄워 확인한다. 특히 Task 3 Step 1 에서 값을 변환한 8곳의 여백을 눈으로 본다.

- `TripPlaceItemButton` — 장소 아이템의 태그 줄 위 여백
- `TripWeatherForecastSheet` — 날씨 시트 헤더 좌우 여백
- `TripDDay` — D-Day 숫자 사이 간격 (3곳)
- `TimeStepHeader` / `CalendarHeader` — 날짜·시각 선택기 헤더 여백
- `BottomSheet.Header` — 모든 바텀시트 헤더의 기본 여백
