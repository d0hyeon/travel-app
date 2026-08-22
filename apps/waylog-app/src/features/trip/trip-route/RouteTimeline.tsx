import styled from '@emotion/native'
import type { RouteLeg } from '@waylog/domains/modules/route'
import { formatDistance, formatDuration } from '@waylog/utility'
import { palette } from '../../../shared/config/tokens'
import { Typography, type StackProps } from '../../../shared/components/mui'
import { TransportIcon } from './TransportIcon'

// 경로 순서를 나타내는 번호 원. 연결선이 이 폭의 중심에 정렬되도록 크기를 공유한다.
const DOT_SIZE = 18

interface RouteLegItemProps extends StackProps {
  leg: RouteLeg
}

// 한 구간(leg)의 이동수단·예상시간·거리를 세로 연결선과 함께 표시하는 타임라인 항목.
export function RouteLegItem({ leg }: RouteLegItemProps) {
  return (
    <Container>
      <Line />
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

export const Dot = styled.View`
  min-width: ${DOT_SIZE}px;
  min-height: ${DOT_SIZE}px;
  border-radius: ${DOT_SIZE / 2}px;
  background-color: ${palette.primary};
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const Line = styled.View`
  position: absolute;
  left: 50%;
  top: 0;
  height: 100%;
  width: 2px;
  background-color: ${palette.divider};
`

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
