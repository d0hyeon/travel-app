import { Box, Stack, styled, Typography, type StackProps } from '@mui/material';
import type { RouteLeg } from '@waylog/domains/route';
import { formatDistance, formatDuration } from '@waylog/utility';
import { TransportIcon } from './TransportIcon';

// 경로 순서를 나타내는 번호 원. 연결선이 이 폭의 중심에 정렬되도록 크기를 공유한다.
const DOT_SIZE = 18;


interface RouteLegItemProps extends StackProps {
  leg: RouteLeg;
}

// 한 구간(leg)의 이동수단·예상시간·거리를 세로 연결선과 함께 표시하는 타임라인 항목.
export function RouteLegItem({ leg, ...props }: RouteLegItemProps) {
  return (
    <Container {...props}>
      <Line />
      <Chip>
        <TransportIcon transport={leg.transport} sx={{ fontSize: 14 }} />
        <Typography variant="caption">
          {formatDuration(leg.duration)} · {formatDistance(leg.distance)}
        </Typography>
      </Chip>
    </Container>
  );
}


const Container = styled(Stack)({
  width: '100%',
  position: 'relative',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',

})


export const Dot = styled(Box)(({ theme }) => ({
  minWidth: DOT_SIZE,
  minHeight: DOT_SIZE,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10,
  fontWeight: 'bold',
  flexShrink: 0,
}));

const Line = styled(Box)(({ theme }) => ({
  position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)',
  height: '100%', width: 2,
  backgroundColor: theme.palette.divider
}))

const Chip = styled(Stack)(({ theme }) => ({
  flexDirection: 'row',
  alignItems: 'center',
  color: theme.palette.text.secondary,
  borderRadius: 8, border: '1px solid rgba(0, 0, 0, 0.2)',
  background: theme.palette.background.default,
  zIndex: 10,
  gap: 0.5,
  paddingInline: 8
}))