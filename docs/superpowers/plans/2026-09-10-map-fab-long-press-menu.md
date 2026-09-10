# 지도 FAB 롱프레스 메뉴 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 여행 장소 탭의 하단 full-width "장소 추가" 버튼을 지도 위 FAB 로 옮기고, 탭은 장소 추가를 즉시 실행하며 롱프레스는 계단식으로 열리는 보조 메뉴를 띄운다.

**Architecture:** 모션 계산(스태거 구간·힌트 오프셋·항목 위치)을 순수 함수 `menuFabMotion.ts` 로 분리해 vitest 로 검증하고, `MenuFab` 컴포넌트는 그 함수들을 Reanimated shared value 에 연결하는 역할만 맡는다. 메뉴 항목은 `MenuFab.Item` 컴파운드 컴포넌트로 받되, 스태거에 필요한 index 는 Context 로 배분한다 — `cloneElement` 로 주입하면 소비자가 조건부 렌더링할 때 index 가 어긋난다.

**Tech Stack:** React Native 0.81 / Reanimated 4.1 / Gesture Handler 2.28 / vitest (environment: node) / `@expo/vector-icons` MaterialIcons

**Spec:** 사용자가 대화로 제시한 "React Native 지도 FAB 롱프레스 메뉴 가이드" (41개 절). 이 문서에 관련 수치를 모두 전재했으므로 별도 파일은 없다.

## 실행 시 보완 사항 (2026-09-10)

- 실행 방식: 현재 `feat/map-fab-menu` 브랜치에서 태스크 순서대로 구현하고 각각 별도 리뷰한다. 모션 계산은 아래 테스트 케이스로 TDD, UI는 데스크탑 iPhone 17 시뮬레이터에서 검증한다.
- 아래 코드는 최초 설계 예시다. 실제 구현에서는 렌더 중 `registerItem()`으로 ref를 변경하지 않고, 정규화한 자식 목록의 순번을 항목별 Context로 전달한다.
- FAB는 화면 바닥이 아닌 현재 보이는 지도 영역의 우측 하단에 배치한다. 기본 높이의 장소 목록 시트에 가려지는 문제를 피하고, 시트를 최대로 올렸을 때는 시트가 FAB를 덮는다.
- React Native에서 롱프레스 뒤 `onPress`가 생략되므로 롱프레스 상태는 다음 `onPressIn`에서 초기화한다.
- `getHintLayerOffset`은 UI 스레드에서 호출되므로 `worklet` 지시문을 포함한다.
- 작성자와 다른 모델의 공동 작성자 표기는 넣지 않는다. 커밋은 실제 변경 목적별로 나눈다.

## Global Constraints

- **주석을 남기지 않는다.** 배경 설명은 커밋 메시지로 옮긴다. 단, 이 프로젝트의 기존 파일들은 "왜 이렇게 했는가"(RN 제약, 웹과의 차이)를 설명하는 주석을 쓴다 — 그런 성격의 주석만 예외로 허용한다.
- **스타일은 `StyleSheet.create` 로 파일 하단에 모은다.** 인라인 객체는 `memo` 를 무력화한다. 런타임 값(insets, 측정 크기)이나 상태 의존 부분만 배열로 합성한다.
- **UI 컴포넌트(`*.tsx`)는 테스트하지 않는다.** 이 저장소에 컴포넌트 테스트 인프라가 없다(`vitest.config.ts` 의 `environment: 'node'`). 빌드와 실제 앱 확인으로 검증한다.
- **테스트 실행:** `pnpm --filter waylog-app test` (루트에서) 또는 `apps/waylog-app` 에서 `pnpm test`.
- **타입 별칭:** `~/shared/components/design-system` 만 vitest 에 등록되어 있다. 순수 로직 파일은 상대 경로 import 만 쓴다.
- **팔레트·radius·zLayer 는 `src/shared/config/tokens.ts` 에서 가져온다.** 색상 리터럴을 새로 만들지 않는다. 단 힌트 레이어의 반투명 primary 는 tokens 에 없으므로 `menu-fab` 내부 상수로 둔다.
- **커밋 메시지는 한글 한 문장.** 스코프를 활용한다(`feat(menu-fab): ...`).
- **브랜치:** `feat/map-fab-menu` (이미 생성됨, `bfb9a40b` 기준).

## 확정된 수치

가이드에서 가져와 이 프로젝트 토큰에 맞춘 값이다. 태스크마다 다시 정하지 않는다.

| 항목 | 값 | 출처 |
| --- | --- | --- |
| FAB 크기 | 52 | 가이드 6절 |
| 힌트 레이어 1 크기 / 기본 오프셋 / 눌림 오프셋 | 44 / 6 / 10 | 가이드 8·22절 |
| 힌트 레이어 2 크기 / 기본 오프셋 / 눌림 오프셋 | 36 / 11 / 18 | 가이드 8·22절 |
| 힌트 레이어 1 / 2 불투명도 | 0.20 / 0.10 | 가이드 9절 |
| 롱프레스 인식 시간 | 400ms | 가이드 11절 |
| 메뉴 항목 높이 / 간격 | 40 / 10 | 가이드 17·25절 |
| 열기 / 닫기 duration | 220ms / 160ms | 가이드 18절 |
| 항목 스태거 지연 (progress 단위) | 0.16 | 가이드 19절 |
| 항목 스태거 구간 폭 (progress 단위) | 0.55 | 가이드 19절 |
| 항목 등장 translateY / scale | 12 → 0 / 0.92 → 1 | 가이드 16절 |
| FAB 아이콘 회전 | 0 → 45deg | 가이드 24절 |
| 오버레이 배경 | `rgba(0,0,0,0.03)` | 가이드 34절 |

---

### Task 1: 모션 계산 순수 함수

메뉴 애니메이션의 계산을 컴포넌트에서 떼어낸다. 이 저장소에서 검증 가능한 유일한 부분이다.

**Files:**
- Create: `apps/waylog-app/src/shared/components/design-system/menu-fab/menuFabMotion.ts`
- Test: `apps/waylog-app/src/shared/components/design-system/menu-fab/menuFabMotion.test.ts`

**Interfaces:**
- Consumes: 없음 (첫 태스크)
- Produces:
  ```ts
  export const FAB_SIZE = 52
  export const ITEM_HEIGHT = 40
  export const ITEM_GAP = 10
  export const LONG_PRESS_DELAY_MS = 400
  export const OPEN_DURATION_MS = 220
  export const CLOSE_DURATION_MS = 160

  export interface HintLayerSpec {
    size: number
    opacity: number
    restingOffset: number
    pressedOffset: number
  }
  export const HINT_LAYERS: readonly [HintLayerSpec, HintLayerSpec]

  export interface StaggerRange { start: number; end: number }
  export function getItemStagger(index: number, count: number): StaggerRange
  export function getItemOffsetY(index: number): number
  export function getHintLayerOffset(layer: HintLayerSpec, pressProgress: number): number
  ```

`getItemStagger` 의 반환값은 소비처에서 `interpolate(menuProgress, [start, end], [0, 1])` 로 쓴다.

`getItemOffsetY` 는 FAB 중심이 아니라 **FAB 상단 기준 위쪽 거리**를 낸다. 소비처가 `bottom` 에 그대로 넣는다.

`getHintLayerOffset` 은 양수를 반환하며, 소비처가 `translateX: +offset`, `translateY: -offset` 으로 우측 상단에 배치한다.

- [x] **Step 1: 검증 케이스 제목을 먼저 적는다**

`menuFabMotion.test.ts` 를 만들고 본문 없이 제목만 적는다. 설계 검증이 목적이다.

```ts
import { describe, it } from 'vitest'

describe('getItemStagger', () => {
  it.todo('FAB 에 가까운 항목이 먼저 시작한다')
  it.todo('마지막 항목도 progress 1 안에서 끝난다')
  it.todo('항목이 하나면 0 에서 시작한다')
})

describe('getItemOffsetY', () => {
  it.todo('첫 항목은 FAB 바로 위에 놓인다')
  it.todo('항목 사이 간격이 일정하다')
})

describe('getHintLayerOffset', () => {
  it.todo('누르지 않은 상태는 기본 오프셋을 낸다')
  it.todo('끝까지 누르면 눌림 오프셋에 도달한다')
  it.todo('뒤쪽 레이어가 앞쪽보다 멀리 간다')
})
```

- [x] **Step 2: 첫 그룹을 실제 테스트로 바꾼다**

```ts
import { describe, expect, it } from 'vitest'
import { getItemStagger } from './menuFabMotion'

describe('getItemStagger', () => {
  it('FAB 에 가까운 항목이 먼저 시작한다', () => {
    expect(getItemStagger(0, 3).start).toBeLessThan(getItemStagger(1, 3).start)
    expect(getItemStagger(1, 3).start).toBeLessThan(getItemStagger(2, 3).start)
  })

  it('마지막 항목도 progress 1 안에서 끝난다', () => {
    expect(getItemStagger(2, 3).end).toBeLessThanOrEqual(1)
    expect(getItemStagger(5, 6).end).toBeLessThanOrEqual(1)
  })

  it('항목이 하나면 0 에서 시작한다', () => {
    expect(getItemStagger(0, 1)).toEqual({ start: 0, end: 1 })
  })
})
```

- [x] **Step 3: 실패를 확인한다**

Run: `cd apps/waylog-app && pnpm test menuFabMotion`
Expected: FAIL — `Failed to resolve import "./menuFabMotion"`

- [x] **Step 4: `getItemStagger` 를 구현한다**

`menuFabMotion.ts` 를 만든다.

```ts
const ITEM_STAGGER_DELAY = 0.16
const ITEM_STAGGER_SPAN = 0.55

export interface StaggerRange {
  start: number
  end: number
}

// 항목이 늘어나면 마지막 항목이 progress 1 을 넘어 영영 나타나지 않는다.
// 전체가 1 에 들어가도록 지연과 구간을 함께 눌러 담는다.
export function getItemStagger(index: number, count: number): StaggerRange {
  if (count <= 1) return { start: 0, end: 1 }

  const naturalSpan = ITEM_STAGGER_DELAY * (count - 1) + ITEM_STAGGER_SPAN
  const scale = naturalSpan > 1 ? 1 / naturalSpan : 1

  const start = index * ITEM_STAGGER_DELAY * scale

  return { start, end: start + ITEM_STAGGER_SPAN * scale }
}
```

- [x] **Step 5: 통과를 확인한다**

Run: `cd apps/waylog-app && pnpm test menuFabMotion`
Expected: PASS (3 passed, 5 todo)

- [x] **Step 6: 두 번째 그룹을 채운다**

```ts
import { FAB_SIZE, ITEM_GAP, ITEM_HEIGHT, getItemOffsetY } from './menuFabMotion'

describe('getItemOffsetY', () => {
  it('첫 항목은 FAB 바로 위에 놓인다', () => {
    expect(getItemOffsetY(0)).toBe(FAB_SIZE + ITEM_GAP)
  })

  it('항목 사이 간격이 일정하다', () => {
    const step = ITEM_HEIGHT + ITEM_GAP
    expect(getItemOffsetY(1) - getItemOffsetY(0)).toBe(step)
    expect(getItemOffsetY(2) - getItemOffsetY(1)).toBe(step)
  })
})
```

- [x] **Step 7: 실패를 확인한다**

Run: `cd apps/waylog-app && pnpm test menuFabMotion`
Expected: FAIL — `getItemOffsetY is not a function`

- [x] **Step 8: 크기 상수와 `getItemOffsetY` 를 구현한다**

`menuFabMotion.ts` 에 추가한다.

```ts
export const FAB_SIZE = 52
export const ITEM_HEIGHT = 40
export const ITEM_GAP = 10

// FAB 상단으로부터의 거리. 소비처가 bottom 에 그대로 넣는다.
export function getItemOffsetY(index: number): number {
  return FAB_SIZE + ITEM_GAP + index * (ITEM_HEIGHT + ITEM_GAP)
}
```

- [x] **Step 9: 통과를 확인한다**

Run: `cd apps/waylog-app && pnpm test menuFabMotion`
Expected: PASS (5 passed, 3 todo)

- [x] **Step 10: 세 번째 그룹을 채운다**

```ts
import { HINT_LAYERS, getHintLayerOffset } from './menuFabMotion'

describe('getHintLayerOffset', () => {
  const [near, far] = HINT_LAYERS

  it('누르지 않은 상태는 기본 오프셋을 낸다', () => {
    expect(getHintLayerOffset(near, 0)).toBe(near.restingOffset)
  })

  it('끝까지 누르면 눌림 오프셋에 도달한다', () => {
    expect(getHintLayerOffset(near, 1)).toBe(near.pressedOffset)
  })

  it('뒤쪽 레이어가 앞쪽보다 멀리 간다', () => {
    expect(getHintLayerOffset(far, 0)).toBeGreaterThan(getHintLayerOffset(near, 0))
    expect(getHintLayerOffset(far, 1)).toBeGreaterThan(getHintLayerOffset(near, 1))
  })
})
```

- [x] **Step 11: 실패를 확인한다**

Run: `cd apps/waylog-app && pnpm test menuFabMotion`
Expected: FAIL — `HINT_LAYERS` / `getHintLayerOffset` 없음

- [x] **Step 12: 힌트 레이어 스펙과 오프셋을 구현한다**

```ts
export interface HintLayerSpec {
  size: number
  opacity: number
  restingOffset: number
  pressedOffset: number
}

export const HINT_LAYERS: readonly [HintLayerSpec, HintLayerSpec] = [
  { size: 44, opacity: 0.2, restingOffset: 6, pressedOffset: 10 },
  { size: 36, opacity: 0.1, restingOffset: 11, pressedOffset: 18 },
] as const

export function getHintLayerOffset(layer: HintLayerSpec, pressProgress: number): number {
  return layer.restingOffset + (layer.pressedOffset - layer.restingOffset) * pressProgress
}
```

- [x] **Step 13: 남은 타이밍 상수를 추가한다**

```ts
export const LONG_PRESS_DELAY_MS = 400
export const OPEN_DURATION_MS = 220
export const CLOSE_DURATION_MS = 160
```

- [x] **Step 14: 전체 통과와 타입을 확인한다**

Run: `cd apps/waylog-app && pnpm test menuFabMotion`
Expected: PASS (8 passed, 0 todo)

Run: `cd /Users/kdh/space/dev/travel-app && pnpm lint`
Expected: 이 파일에 대한 에러 없음

- [x] **Step 15: 커밋**

```bash
git add apps/waylog-app/src/shared/components/design-system/menu-fab/
git commit -m "$(cat <<'EOF'
feat(menu-fab): 메뉴 확장 모션 계산을 순수 함수로 분리한다

EOF
)"
```

---

### Task 2: 메뉴 항목 컴포넌트와 index 배분

항목이 자기 순서를 알아야 스태거가 성립한다. `cloneElement` 대신 Context 로 내린다 — 소비자가 `{cond && <Item/>}` 를 쓰면 `Children` 순회 index 와 실제 렌더 순서가 어긋나기 때문이다.

**Files:**
- Create: `apps/waylog-app/src/shared/components/design-system/menu-fab/MenuFabContext.ts`
- Create: `apps/waylog-app/src/shared/components/design-system/menu-fab/MenuFabItem.tsx`

**Interfaces:**
- Consumes: Task 1 의 `getItemStagger`, `getItemOffsetY`, `ITEM_HEIGHT`
- Produces:
  ```ts
  // MenuFabContext.ts
  export interface MenuFabContextValue {
    menuProgress: SharedValue<number>
    itemCount: number
    registerItem: () => number
    closeMenu: () => void
  }
  export const MenuFabContext: Context<MenuFabContextValue | null>
  export function useMenuFabContext(): MenuFabContextValue

  // MenuFabItem.tsx
  export interface MenuFabItemProps {
    icon?: ReactNode
    onPress?: () => void
    children?: ReactNode
  }
  export function MenuFabItem(props: MenuFabItemProps): ReactElement
  ```

`registerItem()` 은 렌더 중 호출되어 이 항목의 index 를 돌려준다. 부모가 `Children.count` 로 미리 센 개수와 짝을 이룬다.

- [x] **Step 1: Context 를 만든다**

`MenuFabContext.ts`:

```ts
import { createContext, useContext } from 'react'
import type { SharedValue } from 'react-native-reanimated'

export interface MenuFabContextValue {
  menuProgress: SharedValue<number>
  itemCount: number
  registerItem: () => number
  closeMenu: () => void
}

export const MenuFabContext = createContext<MenuFabContextValue | null>(null)

export function useMenuFabContext(): MenuFabContextValue {
  const value = useContext(MenuFabContext)

  if (value == null) {
    throw new Error('MenuFab.Item 은 MenuFab 안에서만 쓸 수 있다')
  }

  return value
}
```

- [x] **Step 2: 항목 컴포넌트를 만든다**

`MenuFabItem.tsx`:

```tsx
import type { ReactNode } from 'react'
import { StyleSheet, Pressable } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { palette, radius, fontSize } from '../../../config/tokens'
import { Typography } from '../Typography'
import { useMenuFabContext } from './MenuFabContext'
import { ITEM_HEIGHT, getItemOffsetY, getItemStagger } from './menuFabMotion'

export interface MenuFabItemProps {
  icon?: ReactNode
  onPress?: () => void
  children?: ReactNode
}

export function MenuFabItem({ icon, onPress, children }: MenuFabItemProps) {
  const { menuProgress, itemCount, registerItem, closeMenu } = useMenuFabContext()
  const index = registerItem()
  const { start, end } = getItemStagger(index, itemCount)

  const animatedStyle = useAnimatedStyle(() => {
    const progress = interpolate(
      menuProgress.get(),
      [start, end],
      [0, 1],
      Extrapolation.CLAMP,
    )

    return {
      opacity: progress,
      transform: [
        { translateY: interpolate(progress, [0, 1], [12, 0]) },
        { scale: interpolate(progress, [0, 1], [0.92, 1]) },
      ],
    }
  })

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.slot, { bottom: getItemOffsetY(index) }, animatedStyle]}
    >
      <Pressable
        style={styles.pill}
        onPress={() => {
          // 닫힘을 기다리면 UI 가 느리게 느껴진다. 동시에 시작한다.
          closeMenu()
          onPress?.()
        }}
      >
        {icon}
        <Typography variant="body2" style={styles.label}>
          {children}
        </Typography>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  slot: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
  },

  pill: {
    minHeight: ITEM_HEIGHT,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.divider,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  label: {
    fontSize: fontSize.body2,
    color: palette.text,
  },
})
```

`onPress` 가 없으면 `closeMenu()` 만 실행된다 — "경로 관리" 가 이 상태다.

- [x] **Step 3: 타입을 확인한다**

`Typography` 의 실제 props 를 열어 `variant="body2"` 와 `style` 이 모두 있는지 확인한다.

Run: `cd apps/waylog-app && cat src/shared/components/design-system/Typography.tsx | head -40`

`variant` 목록에 `body2` 가 없으면 있는 것 중 가장 가까운 값으로 바꾸고, `style` prop 이 없으면 `styles.label` 적용을 빼고 `variant` 만 쓴다. 없는 prop 을 새로 만들지 않는다.

- [x] **Step 4: 커밋**

```bash
git add apps/waylog-app/src/shared/components/design-system/menu-fab/
git commit -m "$(cat <<'EOF'
feat(menu-fab): 계단식으로 등장하는 메뉴 항목을 추가한다

EOF
)"
```

---

### Task 3: MenuFab 루트 — 제스처·힌트 레이어·오버레이

**Files:**
- Create: `apps/waylog-app/src/shared/components/design-system/menu-fab/MenuFab.tsx`
- Modify: `apps/waylog-app/src/shared/config/tokens.ts` (zLayer 에 `mapFab`, `mapFabMenu` 추가)
- Modify: `apps/waylog-app/src/shared/components/design-system/index.ts` (export)

**Interfaces:**
- Consumes: Task 1 의 상수 전부, Task 2 의 `MenuFabContext`·`MenuFabItem`
- Produces:
  ```ts
  export interface MenuFabProps {
    onPress?: () => void
    children?: ReactNode
    disabled?: boolean
    style?: StyleProp<ViewStyle>
  }
  export const MenuFab: ((props: MenuFabProps) => ReactElement) & {
    Item: typeof MenuFabItem
  }
  ```

- [x] **Step 1: zLayer 를 넓힌다**

`tokens.ts` 의 `zLayer` 를 바꾼다. 기존 주석은 유지하고 한 줄만 덧붙인다.

```ts
// 겹침 순서. 값 자체보다 서로의 대소가 의미다.
// 시트는 화면을 덮는 층이므로 흐름에 놓인 하단 CTA 보다 위에 있어야 한다.
// 같은 값을 주면 RN 이 렌더 순서로 정해 CTA 가 시트를 뚫고 나온다.
// 지도 위 FAB 는 지도보다 위, 시트보다 아래다. 시트가 올라오면 FAB 를 덮는다.
export const zLayer = {
  bottomArea: 10,
  mapFab: 15,
  mapFabMenu: 16,
  bottomSheet: 20,
} as const
```

- [x] **Step 2: 루트 컴포넌트를 만든다**

`MenuFab.tsx`:

```tsx
import { Children, type ReactNode, useCallback, useRef, useState } from 'react'
import {
  StyleSheet,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { palette, zLayer } from '../../../config/tokens'
import { MenuFabContext } from './MenuFabContext'
import { MenuFabItem } from './MenuFabItem'
import {
  CLOSE_DURATION_MS,
  FAB_SIZE,
  HINT_LAYERS,
  LONG_PRESS_DELAY_MS,
  OPEN_DURATION_MS,
  getHintLayerOffset,
} from './menuFabMotion'

const HINT_COLOR = 'rgba(76, 132, 255, 1)'

export interface MenuFabProps {
  onPress?: () => void
  children?: ReactNode
  disabled?: boolean
  style?: StyleProp<ViewStyle>
}

function MenuFabRoot({ onPress, children, disabled, style }: MenuFabProps) {
  const [isOpen, setIsOpen] = useState(false)

  const menuProgress = useSharedValue(0)
  const pressProgress = useSharedValue(0)

  // 롱프레스로 열린 뒤의 손 뗌이 탭으로 이어지면 안 된다.
  const didLongPress = useRef(false)

  const itemCount = Children.count(children)

  // 렌더마다 0 부터 다시 세어 각 항목에 순서를 준다.
  const cursor = useRef(0)
  cursor.current = 0
  const registerItem = useCallback(() => cursor.current++, [])

  const openMenu = useCallback(() => {
    setIsOpen(true)
    menuProgress.set(withTiming(1, { duration: OPEN_DURATION_MS }))
  }, [menuProgress])

  const closeMenu = useCallback(() => {
    menuProgress.set(withTiming(0, { duration: CLOSE_DURATION_MS }))
    setIsOpen(false)
  }, [menuProgress])

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - pressProgress.get() * 0.04 }],
  }))

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${menuProgress.get() * 45}deg` }],
  }))

  return (
    <>
      {isOpen && (
        <Pressable style={styles.overlay} onPress={closeMenu} />
      )}

      <View style={[styles.area, style]} pointerEvents="box-none">
        <MenuFabContext.Provider
          value={{ menuProgress, itemCount, registerItem, closeMenu }}
        >
          <View style={styles.menuArea} pointerEvents={isOpen ? 'box-none' : 'none'}>
            {children}
          </View>
        </MenuFabContext.Provider>

        {HINT_LAYERS.map((layer, depth) => (
          <HintLayer key={depth} layer={layer} pressProgress={pressProgress} />
        ))}

        <Animated.View style={fabStyle}>
          <Pressable
            disabled={disabled}
            delayLongPress={LONG_PRESS_DELAY_MS}
            style={styles.fab}
            onPressIn={() => {
              pressProgress.set(withTiming(1, { duration: LONG_PRESS_DELAY_MS }))
            }}
            onPressOut={() => {
              pressProgress.set(withTiming(0, { duration: 150 }))
            }}
            onLongPress={() => {
              didLongPress.current = true
              if (isOpen) closeMenu()
              else openMenu()
            }}
            onPress={() => {
              if (didLongPress.current) {
                didLongPress.current = false
                return
              }

              if (isOpen) {
                closeMenu()
                return
              }

              onPress?.()
            }}
          >
            <Animated.View style={iconStyle}>
              <MaterialIcons name="add" size={26} color="#fff" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </>
  )
}

function HintLayer({
  layer,
  pressProgress,
}: {
  layer: (typeof HINT_LAYERS)[number]
  pressProgress: Animated.SharedValue<number>
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = getHintLayerOffset(layer, pressProgress.get())

    return {
      transform: [{ translateX: offset }, { translateY: -offset }],
    }
  })

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.hint,
        {
          width: layer.size,
          height: layer.size,
          borderRadius: layer.size / 2,
          backgroundColor: HINT_COLOR,
          opacity: layer.opacity,
        },
        animatedStyle,
      ]}
    />
  )
}

export const MenuFab = Object.assign(MenuFabRoot, { Item: MenuFabItem })

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
    zIndex: zLayer.mapFab - 1,
  },

  area: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'flex-end',
    zIndex: zLayer.mapFab,
  },

  menuArea: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
    zIndex: zLayer.mapFabMenu,
  },

  hint: {
    position: 'absolute',
    alignSelf: 'center',
  },

  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.primary,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
})
```

가이드 10절의 idle 반복 모션은 넣지 않는다. `withRepeat` 로 무한 반복하는 요소를 지도 위에 두면 다른 애니메이션과 겹칠 때 산만하고, press-in 강화(22절)만으로 "무언가 열린다"는 신호는 충분하다. 실제 앱에서 확인한 뒤 부족하면 그때 넣는다.

- [x] **Step 3: export 한다**

`design-system/index.ts` 의 `export { Fab } from './Fab'` 아래에 추가한다.

```ts
export { MenuFab } from './menu-fab/MenuFab'
export type { MenuFabProps } from './menu-fab/MenuFab'
export type { MenuFabItemProps } from './menu-fab/MenuFabItem'
```

- [x] **Step 4: 빌드와 lint 를 확인한다**

Run: `cd /Users/kdh/space/dev/travel-app && pnpm lint`
Expected: menu-fab 관련 에러 없음

Run: `cd apps/waylog-app && npx tsc --noEmit -p tsconfig.json`
Expected: menu-fab 관련 에러 없음. `Animated.SharedValue` 타입이 없다는 에러가 나면 `import type { SharedValue } from 'react-native-reanimated'` 로 바꾼다.

- [x] **Step 5: 커밋**

```bash
git add apps/waylog-app/src/shared/components/design-system/ apps/waylog-app/src/shared/config/tokens.ts
git commit -m "$(cat <<'EOF'
feat(menu-fab): 롱프레스로 열리는 지도 FAB 를 추가한다

EOF
)"
```

---

### Task 4: 장소 탭 연결 — 하단 버튼을 FAB 로 교체

**Files:**
- Modify: `apps/waylog-app/src/features/trip/trip-place/TripPlaceContent.tsx`
- Modify: `apps/waylog-app/src/features/trip/trip-place/TripPlaceAdditionButton.tsx`

**Interfaces:**
- Consumes: Task 3 의 `MenuFab`, `MenuFab.Item`
- Produces: 없음 (마지막 태스크)

현재 `TripPlaceAdditionButton` 은 `Button` 을 직접 렌더한다. FAB 는 라벨이 없으므로 "장소 검색 시트를 열고 결과를 저장하는 동작"만 필요하다. 컴포넌트를 훅으로 바꾼다.

- [ ] **Step 1: 장소 추가 동작을 훅으로 뽑는다**

`TripPlaceAdditionButton.tsx` 를 지우고 같은 디렉토리에 `useTripPlaceAddition.ts` 를 만든다.

```ts
import { useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import type { TripPlace } from '@waylog/domains/modules/place'
import { useCallback } from 'react'
import { usePlaceSearchBottomSheet } from '../../place/place-search/usePlaceSearchBottomSheet'

export function useTripPlaceAddition(tripId: string) {
  const { data: trip } = useTrip(tripId)
  const { create } = useTripPlaces(tripId)

  const { searchPlace } = usePlaceSearchBottomSheet({
    service: trip.isOverseas ? 'google' : 'kakao',
    center: { lat: trip.lat, lng: trip.lng },
  })

  const addPlace = useCallback(async (): Promise<TripPlace | null> => {
    const place = await searchPlace()
    if (place == null) return null

    return create(place)
  }, [searchPlace, create])

  return { addPlace }
}
```

기존 컴포넌트의 `Suspense` 경계는 호출부가 이미 `Suspense` 안이므로 훅에서는 필요 없다. `TripPlaceContent` 가 이미 `useTrip`·`useTripPlaces` 를 부르고 있어 같은 경계를 공유한다.

- [ ] **Step 2: 다른 소비처가 없는지 확인한다**

Run: `cd /Users/kdh/space/dev/travel-app && grep -rn "TripPlaceAdditionButton" apps/ --include=*.tsx --include=*.ts`
Expected: `TripPlaceContent.tsx` 외에 결과가 없어야 한다. 다른 곳이 있으면 그 파일도 훅으로 바꾼다.

- [ ] **Step 3: TripPlaceContent 를 바꾼다**

import 를 교체한다.

```ts
// 지운다
import { TripPlaceAdditionButton } from './TripPlaceAdditionButton';
import { BottomArea } from '../../../shared/components/BottomArea';
import { TAB_BAR_SIDE_INSET } from '../../../shared/components';

// 추가한다
import { MaterialIcons } from '@expo/vector-icons';
import { MenuFab } from '~/shared/components/design-system';
import { useTripPlaceAddition } from './useTripPlaceAddition';
```

컴포넌트 본문에 훅을 부른다.

```ts
const { addPlace } = useTripPlaceAddition(tripId)

const handleAddPlace = async () => {
  const added = await addPlace()
  if (added == null) return

  setFocusedId(added.id)
  mapRef.current?.panTo(added.lat, added.lng, 5)
}
```

`<Box style={styles.container}>` 의 닫는 태그 **직전** — `BottomSheet` 다음 — 에 FAB 를 넣는다. 지도 영역 소속이므로 `container` 안이다.

```tsx
        </BottomSheet>

        <MenuFab onPress={handleAddPlace}>
          <MenuFab.Item
            icon={<MaterialIcons name="add-location-alt" size={18} color={palette.primary} />}
            onPress={handleAddPlace}
          >
            장소 추가
          </MenuFab.Item>
          <MenuFab.Item
            icon={<MaterialIcons name="route" size={18} color={palette.primary} />}
          >
            경로 관리
          </MenuFab.Item>
        </MenuFab>
      </Box>
```

"경로 관리" 에 `onPress` 를 주지 않는다. 누르면 메뉴만 닫힌다.

`</Box>` 뒤에 있던 `<BottomArea>` 블록 전체를 지운다.

- [ ] **Step 4: 남은 스타일을 정리한다**

`styles` 에서 `bottomCta` 를 지운다. `TAB_BAR_SIDE_INSET` import 가 이 파일에서 더 쓰이지 않으면 그 import 도 지운다.

- [ ] **Step 5: lint 와 타입을 확인한다**

Run: `cd /Users/kdh/space/dev/travel-app && pnpm lint`
Expected: 에러 없음. 쓰지 않는 import 가 남아 있으면 여기서 잡힌다.

Run: `cd apps/waylog-app && npx tsc --noEmit -p tsconfig.json`
Expected: 에러 없음

- [ ] **Step 6: 실제 앱에서 확인한다**

Run: `cd apps/waylog-app && pnpm start`

여행 상세 → 장소 탭에서 확인한다. 컴포넌트 테스트가 없으므로 이 단계가 유일한 UI 검증이다.

1. FAB 가 지도 우측 하단에 있고 뒤에 옅은 원 두 개가 우측 상단으로 어긋나 보인다
2. 탭하면 장소 검색 시트가 바로 열린다
3. 누르고 있으면 FAB 가 살짝 줄고 뒤 원들이 더 벌어진다
4. 400ms 지나면 항목이 아래에서 위로 하나씩 쌓인다
5. `+` 아이콘이 `×` 로 회전한다
6. 바깥을 누르면 닫힌다
7. "장소 추가" 항목이 탭과 같은 시트를 연다
8. "경로 관리" 를 누르면 메뉴만 닫힌다
9. 바텀시트를 최대로 올리면 시트가 FAB 를 덮는다
10. 롱프레스 후 손을 떼도 장소 검색 시트가 열리지 않는다

10번이 실패하면(시트가 열리면) `onPress`/`onLongPress` 발화 순서가 예상과 다른 것이다. `didLongPress` 초기화 시점을 `onPressIn` 으로 옮겨 확인한다.

- [ ] **Step 7: 커밋**

동작이 다르면 여기서 멈추고 보고한다. 확인이 끝났으면 커밋한다.

```bash
git add apps/waylog-app/src/features/trip/trip-place/
git commit -m "$(cat <<'EOF'
feat(trip-place): 장소 추가를 지도 위 FAB 로 옮긴다

EOF
)"
```

- [ ] **Step 8: codebase.md 를 갱신한다**

`docs/codebase.md` 의 앱 디렉토리 구조에서 `design-system/` 줄 아래에 `menu-fab/` 을 한 줄 추가한다. 기존 `bottom-sheet/`·`tab-navigation/` 항목과 같은 형식을 따른다.

```
│   │   │   ├── design-system/ # 자체 디자인 시스템 — 웹 theme 어휘 + RN 표준 인터페이스
│   │   │   │   └── menu-fab/ # 탭=기본 액션, 롱프레스=계단식 보조 메뉴.
│   │   │   │                 #   모션 계산은 menuFabMotion.ts 에 순수 함수로 분리
```

```bash
git add docs/codebase.md
git commit -m "$(cat <<'EOF'
docs: 코드베이스 레퍼런스에 menu-fab 을 반영한다

EOF
)"
```

---

## 웨이브 구성

| 웨이브 | 태스크 | 병렬 가능 |
| --- | --- | --- |
| 1 | Task 1 | — |
| 2 | Task 2 | Task 1 의 상수·함수에 의존 |
| 3 | Task 3 | Task 2 의 Context·Item 에 의존 |
| 4 | Task 4 | Task 3 의 MenuFab 에 의존 |

전부 직렬이다. 같은 디렉토리의 파일들이 서로의 export 를 받아 쓰므로 웨이브를 겹칠 수 없다.

## 이 플랜이 다루지 않는 것

- **가이드 10절 idle 반복 모션** — Task 3 에서 뺀 이유를 적었다. 실기 확인 후 필요하면 별도 작업.
- **"지도에서 선택" 항목** — 앱에 기능 자체가 없다. 신규 구현이라 범위 밖.
- **"경로 관리" 의 실제 동작** — 사용자 결정으로 구성만 한다.
- **웹의 동일 변경** — 이 작업은 앱 단독이다. 웹의 장소 탭 하단 버튼은 그대로 둔다.
