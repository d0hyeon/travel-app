import { MaterialIcons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { BottomSheet } from '~/shared/components/bottom-sheet/BottomSheet'
import { palette } from '~/shared/config/tokens'

interface Props {
  isOpen: boolean
  onDismiss: () => void
  flightStatusAirportNames: string[]
  guidanceAirportNames: string[]
}

export function SupportedNotificationSheet({
  isOpen,
  onDismiss,
  flightStatusAirportNames,
  guidanceAirportNames,
}: Props) {
  const flightStatusAirports = flightStatusAirportNames.join(', ')
  const guidanceAirports = guidanceAirportNames.join(', ')

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onDismiss} snapPoints={[0.85]} safeArea>
      <BottomSheet.Body>
        <BottomSheet.ScrollView contentContainerStyle={styles.content}>

          <Section title="여정 변동 알림" caption="운항 지연, 결항, 탑승구 변경을 알려드려요">
            <Group label="항공">
              <Item label="대상" description={`${flightStatusAirports} 출발편`} />
              <Item
                label="푸시 알림"
                description="출발 24시간 전부터 출발할 때까지 변동 사항이 생기면 알려드려요"
              />
            </Group>
            <Group label="버스/기차">
              <Typography variant="body2" color="text.secondary">지원되지 않아요</Typography>
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
              <Typography variant="body2" color="text.secondary">지원되지 않아요</Typography>
            </Group>
          </Section>

          <Section title="탑승 안내" caption="탑승 준비 시간을 놓치지 않도록 알려드려요">
            <Group label="항공">
              <Item label="대상" description="모든 항공편" />
              <Item
                label="푸시 알림"
                description="출발 30분 전에 알려드려요. 탑승은 보통 출발 20분 전부터 시작해요"
              />
            </Group>
            <Group label="버스/기차">
              <Item label="대상" description="모든 버스·기차" />
              <Item label="푸시 알림" description="출발 10분 전에 알려드려요" />
            </Group>
          </Section>

          <Stack direction="row" alignItems="flex-start" gap={0.5}>
            <MaterialIcons name="info-outline" size={14} color={palette.textDisabled} style={styles.noticeIcon} />
            <Typography variant="caption" color="text.disabled" style={styles.notice}>
              운항 정보는 공공데이터를 기준으로 하며 몇 분 늦게 반영될 수 있어요. 탑승권의 출발 시각이 실제와
              크게 다르면 조회되지 않을 수 있어요.
            </Typography>
          </Stack>
        </BottomSheet.ScrollView>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="contained" size="large" onPress={onDismiss} fullWidth>확인</Button>
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="caption" color="text.secondary" mt={0.5}>
          {caption}
        </Typography>
      </View>
      <View style={styles.items}>{children}</View>
    </View>
  )
}

interface ItemProps {
  label: string
  description: string
}

function Item({ label, description }: ItemProps) {
  return (
    <View style={styles.item}>
      <Typography variant="caption" color="text.secondary" style={styles.itemLabel}>
        {label}
      </Typography>
      <Typography variant="body2" style={styles.description}>
        {description}
      </Typography>
    </View>
  )
}

function Group({ label, children }: { label: string, children: ReactNode }) {
  return (
    <View style={styles.group}>
      <Typography variant="body2" style={styles.itemLabel}>
        {label}
      </Typography>
      <View style={styles.groupBody}>
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 16, gap: 28 },
  section: { gap: 14 },
  sectionHeader: { gap: 2 },
  items: { gap: 24, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: palette.divider },
  item: { gap: 4 },
  itemLabel: { fontWeight: '700' },
  description: { lineHeight: 19, },
  noticeIcon: { marginTop: 2 },
  notice: { flex: 1, lineHeight: 18 },
  group: { gap: 8 },
  groupBody: { paddingLeft: 12, gap: 12 }
})
