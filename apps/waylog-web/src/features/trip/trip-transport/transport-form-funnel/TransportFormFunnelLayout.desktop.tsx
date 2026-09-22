import { Box, Stack, type StackProps } from '@mui/material'
import type { ReactNode } from 'react'

// 시안 규격: 헤더·본문·푸터가 같은 폭으로 정렬한다.
const CONTENT_WIDTH = 480

interface Props {
  children: ReactNode
}

export function TransportFormBody({ children }: Props) {
  return (
    <Box flex={1} overflow="auto" display="flex" justifyContent="center" py={4}>
      <Box width={CONTENT_WIDTH} display="flex" flexDirection="column">
        {children}
      </Box>
    </Box>
  )
}

// 화면 하단에 붙는 동작 바다. 어떤 동작을 둘지는 각 단계가 정한다.
export function TransportFormFooter({ children, ...props }: Props & StackProps) {
  return (
    <Box borderTop={1} borderColor="divider" py={2} display="flex" flexShrink={0} paddingX={2}>
      <Stack
        direction="row"
        gap={1.5}
        alignItems="center"
        justifyContent="flex-end"
        maxWidth={1200}
        width="100%"
        {...props}
      >
        {children}
      </Stack>
    </Box>
  )
}
