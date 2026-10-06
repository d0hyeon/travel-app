import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'

interface Props {
  isOpen: boolean
  onClose: () => void
  flightStatusAirportNames: string[]
  guidanceAirportNames: string[]
}

export function SupportedNotificationSheet({
  isOpen,
  onClose,
  flightStatusAirportNames,
  guidanceAirportNames,
}: Props) {
  const flightStatusAirports = flightStatusAirportNames.join(', ')
  const guidanceAirports = guidanceAirportNames.join(', ')

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={[0.85]}>
      <BottomSheet.Body>
        <BottomSheet.Scrollable>
          <Stack gap={3.5} px={1} pb={2}>
            <Section title="여정 변동 알림" caption="운항 지연, 결항, 탑승구 변경을 알려드려요">
              <Group label="항공">
                <Item label="대상" description={`${flightStatusAirports} 출발편`} />
                <Item
                  label="푸시 알림"
                  description="출발 24시간 전부터 출발할 때까지 변동 사항이 생기면 알려드려요"
                />
              </Group>
              <Group label="버스/기차">
                <Unsupported />
              </Group>
            </Section>

            <Section title="공항 도착 권장시간 안내" caption="혼잡도를 반영한 권장 도착 시각을 알려드려요">
              <Group label="해외 항공">
                <Item label="대상" description="인천 출발편" />
                <Item label="푸시 알림" description="출발 전날 오후 6시에 알려드려요" />
              </Group>
              <Group label="국내 항공">
                <Item label="대상" description={`${guidanceAirports} 출발편`} />
              </Group>
              <Group label="버스/기차">
                <Unsupported />
              </Group>
            </Section>

            <Section title="탑승 안내" caption="탑승 준비 시간을 놓치지 않도록 알려드려요">
              <Group label="항공">
                <Item label="대상" description="모든 항공편" />
                <Item
                  label="푸시 알림"
                  description="출발 30분 전에 알려드려요."
                />
              </Group>
              <Group label="버스/기차">
                <Item label="대상" description="모든 버스·기차" />
                <Item label="푸시 알림" description="출발 10분 전에 알려드려요" />
              </Group>
            </Section>

            <Stack direction="row" alignItems="flex-start" gap={0.5}>
              <InfoOutlinedIcon sx={{ fontSize: 14, mt: '2px', color: 'text.disabled' }} />
              <Typography variant="caption" color="text.disabled" flex={1} lineHeight="18px">
                운항 정보는 공공데이터를 기준으로 하며 몇 분 늦게 반영될 수 있어요. 탑승권의 출발 시각이 실제와
                크게 다르면 조회되지 않을 수 있어요.
              </Typography>
            </Stack>
          </Stack>
        </BottomSheet.Scrollable>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="contained" size="large" onClick={onClose} fullWidth>
          확인
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

interface SectionProps {
  title: string
  caption: string
  children: ReactNode
}

function Section({ title, caption, children }: SectionProps) {
  return (
    <Stack gap={1.75}>
      <Stack gap={0.25}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="caption" color="text.secondary" mt={0.5}>
          {caption}
        </Typography>
      </Stack>
      <Stack gap={3} pl={1.5} borderLeft="2px solid" borderColor="divider">
        {children}
      </Stack>
    </Stack>
  )
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={1}>
      <Typography variant="body2" fontWeight={700}>
        {label}
      </Typography>
      <Stack gap={1.5} pl={1.5}>
        {children}
      </Stack>
    </Stack>
  )
}

function Item({ label, description }: { label: string; description: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="body2" lineHeight="19px" mt={0.5}>
        {description}
      </Typography>
    </Box>
  )
}

function Unsupported() {
  return (
    <Typography variant="body2" color="text.secondary">
      지원되지 않아요
    </Typography>
  )
}
