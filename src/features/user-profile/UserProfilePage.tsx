import { Box, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { ResizeObserverArea } from '~shared/components/ResizeObserverArea'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { arrayIncludes, assert } from '~shared/utils/types'
import { ProfileFeedTab } from './ProfileFeedTab'
import { ProfileHeader } from './ProfileHeader'
import { ProfileRecordsTab } from './ProfileRecordsTab'
import { ProfileStatStrip } from './ProfileStatStrip'

const TABS = ['feed', 'records'] as const
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  feed: '피드',
  records: '기록',
}

const FULL_CONTENTS = ['records'] satisfies Tab[]

export default function UserProfilePage() {
  const userId = useUserId();
  const [tab, setTab] = useQueryParamState<Tab>('tab', { defaultValue: 'feed' })
  const [hasScrolledToTab, setHasScrolledToTab] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasScrolledToTab(false)
  }, [tab])

  const shouldScrollOnLayout = arrayIncludes(FULL_CONTENTS, tab) && !hasScrolledToTab

  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      <ProfileHeader userId={userId} />
      <Box pb={1}>
        <ProfileStatStrip userId={userId} />
      </Box>

      <Box
        ref={tabRef}
        position="sticky"
        top={0}
        zIndex={5}
        bgcolor="background.paper"
        borderBottom="1px solid rgba(0,0,0,0.08)"
      >
        <Tabs
          value={tab}
          onChange={(_, next) => setTab(next as Tab)}
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

      <ResizeObserverArea
        enabled={shouldScrollOnLayout}
        onResize={() => {
          setHasScrolledToTab(true)
          tabRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }}
      >
        <Stack flex={1}>
          {tab === 'feed' ? (
            <ProfileFeedTab userId={userId} />
          ) : (
            <ProfileRecordsTab userId={userId} />
          )}
        </Stack>
      </ResizeObserverArea>
    </Box>
  )
}

function useUserId() {
  const { userId } = useParams<{ userId: string }>()
  assert(!!userId, '잘못된 경로입니다.')

  return userId;
}

