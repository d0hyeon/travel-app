import styled from '@emotion/native'
import { View, type ViewStyle } from 'react-native'
import type { ReactNode } from 'react'
import type { RouteLeg } from '@waylog/domains/modules/route'
import { formatDistance, formatDuration } from '@waylog/utility'
import { palette } from '../../../shared/config/tokens'
import { Typography, type StackProps } from '~/shared/components/design-system'
import { TransportIcon } from './TransportIcon'

// 경로 순서를 나타내는 번호 원. 연결선이 이 폭의 중심에 정렬되도록 크기를 공유한다.
const DOT_SIZE = 20

interface RouteLegItemProps extends StackProps {
  leg: RouteLeg
}

// 한 구간(leg)의 이동수단·예상시간·거리를 세로 연결선과 함께 표시하는 타임라인 항목.
export function RouteLegItem({ leg, ...props }: RouteLegItemProps) {
  return (
    <Container {...props}>
      <Line style={{ top: 0 }} />
      <Line style={{ bottom: 0 }} />
      <Chip>
        <TransportIcon transport={leg.transport} size={14} />
        <Typography variant="caption" color="text.secondary">
          {formatDuration(leg.duration)} · {formatDistance(leg.distance)}
        </Typography>
      </Chip>
    </Container>
  )
}

const Container = styled.View`
  width: 100%;
  position: relative;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding-vertical: 6px;
`

// styled 로 준 크기·flex 는 이 자리에서 무시돼 번호 폭만큼 찌그러졌다.
// 인라인 스타일로 직접 고정한다.
export function Dot({ children }: { children?: ReactNode }) {
  return (
    <View
      style={{
        width: DOT_SIZE,
        height: DOT_SIZE,
        minWidth: DOT_SIZE,
        minHeight: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: palette.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexGrow: 0,
        flexShrink: 0,
        flexBasis: 'auto',
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  )
}

// Chip 이 가운데를 덮으므로 위·아래 두 구간으로 나눠 그린다.
// styled 로 준 값은 이 자리에서 무시되므로 인라인 스타일로 준다.
function Line({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[
        { position: 'absolute', left: '50%', height: '50%', width: 2, backgroundColor: palette.divider },
        style,
      ]}
    />
  )
}

const Chip = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  border-width: 1px;
  border-color: rgba(0, 0, 0, 0.2);
  background-color: ${palette.background};
  z-index: 10;
  padding-horizontal: 8px;
  padding-vertical: 2px;
`
