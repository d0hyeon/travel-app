import { Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useParams } from 'react-router'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { ProfileFeedTab } from './ProfileFeedTab'
import { ProfileHeader } from './ProfileHeader'
import { ProfileRecordsTab } from './ProfileRecordsTab'
import { ProfileStatStrip } from './ProfileStatStrip'

const TABS = ['feed', 'records'] as const
type TabKey = typeof TABS[number]

const TAB_LABELS: Record<TabKey, string> = {
  feed: '피드',
  records: '기록',
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  if (!userId) throw new Error('userId가 필요해요')

  const [tab, setTab] = useQueryParamState<TabKey>('tab', { defaultValue: 'feed' })

  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      <ProfileHeader userId={userId} />
      <Box pb={1}>
        <ProfileStatStrip userId={userId} />
      </Box>

      <Box position="sticky" top={0} zIndex={5} bgcolor="background.paper" borderBottom="1px solid rgba(0,0,0,0.08)">
        <Tabs
          value={tab}
          onChange={(_, next) => setTab(next as TabKey)}
          variant="fullWidth"
          slotProps={{ indicator: { sx: { height: 2, bgcolor: '#111' } } }}
        >
          {TABS.map((key) => (
            <Tab
              key={key}
              value={key}
              label={
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: tab === key ? 700 : 500,
                    color: tab === key ? '#111' : '#6b6b73',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {TAB_LABELS[key]}
                </Typography>
              }
              sx={{ minHeight: 44 }}
            />
          ))}
        </Tabs>
      </Box>

      <Stack flex={1}>
        {tab === 'feed' ? (
          <ProfileFeedTab userId={userId} />
        ) : (
          <ProfileRecordsTab userId={userId} />
        )}
      </Stack>
    </Box>
  )
}
