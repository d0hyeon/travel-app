import { StyleSheet, View, type ViewStyle } from 'react-native'
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
export function RouteLegItem({ leg, style, ...props }: RouteLegItemProps) {
  return (
    <View style={[styles.container, style]} {...props}>
      <Line style={styles.lineTop} />
      <Line style={styles.lineBottom} />
      <View style={styles.chip}>
        <TransportIcon transport={leg.transport} size={14} />
        <Typography variant="caption" color="text.secondary">
          {formatDuration(leg.duration)} · {formatDistance(leg.distance)}
        </Typography>
      </View>
    </View>
  )
}

export function Dot({ children }: { children?: ReactNode }) {
  return <View style={styles.dot}>{children}</View>
}

// Chip 이 가운데를 덮으므로 위·아래 두 구간으로 나눠 그린다.
function Line({ style }: { style?: ViewStyle }) {
  return <View style={[styles.line, style]} />
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  dot: {
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
  },
  line: {
    position: 'absolute',
    left: '50%',
    height: '50%',
    width: 2,
    backgroundColor: palette.divider,
  },
  lineTop: { top: 0 },
  lineBottom: { bottom: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    backgroundColor: palette.background,
    zIndex: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
})
