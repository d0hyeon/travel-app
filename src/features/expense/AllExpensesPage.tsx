import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, Container, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { StatisticsCurrencySection } from './StatisticsCurrencySection'
import { StatisticsOverviewSection } from './StatisticsOverviewSection'
import { StatisticsRankingSection } from './StatisticsRankingSection'
import { useAllExpenseSummary } from './useAllExpenseSummary'

type StatisticsTab = 'overview' | 'ranking' | 'currency'

export default function AllExpensesPage() {
  const summary = useAllExpenseSummary()
  const [currentTab, setCurrentTab] = useQueryParamState<StatisticsTab>('stats-tab', {
    defaultValue: 'overview',
  })

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack gap={3}>
        <Stack gap={1.25}>
          <Stack direction="row" alignItems="center" gap={1}>
            <ReceiptLongIcon color="primary" fontSize="small" />
            <Typography variant="h6" fontWeight={800}>
              통계
            </Typography>
          </Stack>

          <Tabs
            value={currentTab}
            onChange={(_, value: StatisticsTab) => setCurrentTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                minHeight: 40,
                borderRadius: 999,
                mr: 1,
                px: 1.75,
              },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab value="overview" label="개요" />
            <Tab value="ranking" label="랭킹" />
            <Tab value="currency" label="통화" />
          </Tabs>
        </Stack>

        {summary.travelSummaries.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography variant="body1" color="text.secondary">
              아직 기록된 지출이 없어요.
            </Typography>
          </Box>
        ) : null}

        {summary.travelSummaries.length > 0 && currentTab === 'overview' ? (
          <StatisticsOverviewSection summary={summary} />
        ) : null}

        {summary.travelSummaries.length > 0 && currentTab === 'ranking' ? (
          <StatisticsRankingSection summary={summary} />
        ) : null}

        {summary.travelSummaries.length > 0 && currentTab === 'currency' ? (
          <StatisticsCurrencySection summary={summary} />
        ) : null}
      </Stack>
    </Container>
  )
}
