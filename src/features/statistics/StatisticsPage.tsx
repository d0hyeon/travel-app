import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useQueryParamState } from '~shared/hooks/useQueryParamState'
import { StatisticsCurrencySection } from './StatisticsCurrencySection'
import { StatisticsOverviewSection } from './StatisticsOverviewSection'
import { StatisticsRankingSection } from './StatisticsRankingSection'
import { useStatisticsSummary } from './statistics-expense/useStatisticsSummary'

type StatisticsTab = 'overview' | 'ranking' | 'currency'

export default function StatisticsPage() {
  const summary = useStatisticsSummary()
  const [currentTab, setCurrentTab] = useQueryParamState<StatisticsTab>('stats-tab', {
    defaultValue: 'overview',
  })

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <Box
        position="sticky"
        top={0}
        px={2}
        py={1}
        pb={0}
        width="100%"
        bgcolor="background.paper"
        zIndex={10}
      >
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
              borderBottom: '1px solid #ddd',
            }}
          >
            <Tab value="overview" label="개요" />
            <Tab value="ranking" label="랭킹" />
            <Tab value="currency" label="통화" />
          </Tabs>
        </Stack>
      </Box>

      <Box px={2} py={2} flex={1} overflow="auto">
        <Stack gap={3}>
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
      </Box>
    </Box>
  )
}
