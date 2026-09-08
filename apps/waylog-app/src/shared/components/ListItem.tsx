import type { ElementType, ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { palette } from '../config/tokens'
import {
  Box,
  Stack,
  Typography,
  type BoxProps,
  type PropsWithAs,
  type StackProps,
  type TypographyProps,
} from './mui'

interface Props extends StackProps {
  leftAddon?: ReactNode
  rightAddon?: ReactNode
  children?: ReactNode
}

export function ListItem<As extends ElementType = typeof View>({
  leftAddon,
  rightAddon,
  children,
  alignItems = 'center',
  gap,
  sx,
  as,
  ...props
}: PropsWithAs<Props, As>) {
  return (
    // 미해결 제네릭 As 에는 구체 props 를 대입할 수 없다(폴리모픽 컴포넌트의 알려진 제약).
    // 내부에서만 캐스팅으로 끊고, 호출부 타입은 그대로 지킨다.
    <Stack
      as={as as ElementType}
      gap={gap ?? 0.5}
      alignItems={alignItems}
      direction="row"
      justifyContent="space-between"
      sx={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: palette.divider,
        borderRadius: 12,
        overflow: 'visible',
        ...(sx ?? {}),
      }}
      {...props}
    >
      <Stack
        direction="row"
        gap={gap ?? 1}
        alignItems={alignItems}
        sx={{ width: '100%', minWidth: 0, flex: 1 }}
      >
        {leftAddon}
        <Stack gap={0.5} sx={{ flex: 1, minWidth: 0 }}>
          {children}
        </Stack>
      </Stack>

      {rightAddon}
    </Stack>
  )
}

interface ButtonProps extends Props {
  focused?: boolean
  onClick?: () => void
}

function ListItemButton({
  focused,
  sx,
  onClick,
  leftAddon,
  rightAddon,
  children,
  ...props
}: ButtonProps) {
  // 좌우 애드온은 자체 버튼을 갖는 경우가 많다(정렬 핸들·메뉴).
  // 통째로 Pressable 안에 넣으면 바깥이 터치를 먼저 가져가 눌리지 않는다.
  return (
    <ListItem
      leftAddon={leftAddon}
      rightAddon={rightAddon}
      sx={{
        width: '100%',
        // 웹은 :focus 에 primary 20% 배경을 준다.
        ...(focused ? { backgroundColor: 'rgba(76,132,255,0.2)' } : {}),
        ...(sx ?? {}),
      }}
      {...props}
    >
      {/* 스타일 없는 Pressable 은 컨텐츠 폭으로 수축한다.
          그 안의 제목 행이 함께 눌려 순번 원이 찌그러진다. */}
      <Pressable onPress={onClick} style={{ width: '100%' }}>
        {children}
      </Pressable>
    </ListItem>
  )
}

ListItem.Button = ListItemButton

ListItem.Title = ({
  leftAddon,
  rightAddon,
  ...props
}: TypographyProps & { leftAddon?: ReactNode; rightAddon?: ReactNode }) => (
  <Stack gap={1} direction="row" alignItems="center" sx={{ minWidth: 0, flexShrink: 1 }}>
    {leftAddon}
    <Typography numberOfLines={1} sx={{ fontSize: 13, flexShrink: 1 }} {...props} />
    {rightAddon}
  </Stack>
)

ListItem.Text = ({
  leftAddon,
  rightAddon,
  ...props
}: TypographyProps & { leftAddon?: ReactNode; rightAddon?: ReactNode }) => (
  <Stack gap={0.25} direction="row" alignItems="center">
    {leftAddon}
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ fontSize: 12 }}
      {...props}
    />
    {rightAddon}
  </Stack>
)

ListItem.Ordering = ({ sx, children, ...props }: BoxProps) => (
  <Box
    sx={{
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: palette.primary,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...(sx ?? {}),
    }}
    {...props}
  >
    <Typography sx={{ color: '#fff', fontSize: 11, fontWeight: '900' }}>{children}</Typography>
  </Box>
)
