import { useTripMembers } from '@waylog/domains/modules/trip-member'
import { Suspense, useState } from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Box, Tab, Tabs, Typography } from '~shared/components/design-system'
import { FLOATING_TAB_BAR_RESERVE } from '~shared/components'
import { ExpenseList } from './ExpenseList'
import { SettlementSummary } from './SettlementSummary'

interface Props {
  tripId: string
}

type SubTab = 'list' | 'settlement'

export function ExpenseBody({ tripId }: Props) {
  const [currentSubTab, selectSubTab] = useState<SubTab>('list')

  return (
    <Box style={styles.container}>
      <Tabs fullWidth value={currentSubTab} onChange={(_, value) => selectSubTab(value as SubTab)}>
        <Tab value="list" label="지출 내역" />
        <Tab value="settlement" label="정산" />
      </Tabs>
      <Suspense fallback={<Pending currentSubTab={currentSubTab} />}>
        <Resolved tripId={tripId} currentSubTab={currentSubTab} />
      </Suspense>
    </Box>
  )
}

interface ContentProps extends Props {
  currentSubTab: SubTab
}

function Pending({ currentSubTab }: Pick<ContentProps, 'currentSubTab'>) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {currentSubTab === 'list' && <ExpenseList.Skeleton />}
      {currentSubTab === 'settlement' && <SettlementSummary.Skeleton />}
    </ScrollView>
  )
}

function Resolved({ tripId, currentSubTab }: ContentProps) {
  const { data: members } = useTripMembers(tripId)

  if (members.length === 0) {
    return (
      <Typography color="text.secondary" style={styles.emptyMessage}>
        먼저 기본 정보 탭에서 인원을 추가해주세요
      </Typography>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {currentSubTab === 'list' && <ExpenseList tripId={tripId} />}
      {currentSubTab === 'settlement' && <SettlementSummary tripId={tripId} />}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyMessage: { padding: 24, textAlign: 'center' },
  scrollContent: { padding: 16, paddingBottom: 16 + FLOATING_TAB_BAR_RESERVE },
})
