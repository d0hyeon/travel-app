import { Box, Container, IconButton, Stack, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import 'scrollyfills'
import { useParams } from 'react-router'
import { ResizeObserverArea } from '~shared/components/ResizeObserverArea'
import { useQueryParamState } from '~shared/hooks/urls/useQueryParamState'
import { arrayIncludes, assert } from '~shared/utils/types'
import { ProfileFeedTab } from './ProfileFeedTab'
import { ProfileHeader } from './ProfileHeader'
import { ProfileRecordsTab } from './ProfileRecordsTab'
import { ProfileStatStrip } from './ProfileStatStrip'
import { useScrollContainer } from '~shared/hooks/interaction/useScrollRestore'
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '~features/auth/useAuth'
import { signOut } from '~features/auth/auth.api'

const TABS = ['feed', 'records'] as const
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  feed: '피드',
  records: '기록',
}

const EXTEND_VIEWPORT_CONTENTS = ['records'] satisfies Tab[]

export default function UserProfilePage() {
  const userId = useUserId();
  const { data: { id: currentUserId } } = useAuth();
  const [currentTab, selectTab] = useQueryParamState<Tab>('tab', { defaultValue: 'feed' })

  const [isExtendedViewport, setIsExtendedViewport] = useState(false);
  const topElementRef = useRef<HTMLDivElement>(null);

  /** 스크롤 제어를 통해 컨텐츠의 뷰포트를 확대한다. */
  const extendViewport = async () => {
    setIsExtendedViewport(true)
    topElementRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
  useEffect(() => {
    setIsExtendedViewport(false)
  }, [currentTab])

  const isExtendContent = arrayIncludes(EXTEND_VIEWPORT_CONTENTS, currentTab) && !isExtendedViewport;



  return (
    <Box display="flex" flexDirection="column" minHeight="100%">
      <Container maxWidth="md" sx={{ paddingX: '0px !important' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" py={1}>
          <ProfileHeader userId={userId} />
          {currentUserId === userId && (
            <IconButton color="error" onClick={() => signOut()}>
              <LogoutIcon />
            </IconButton>
          )}

        </Stack>
        <Box pb={1}>
          <ProfileStatStrip userId={userId} />
        </Box>


        <Box
          ref={topElementRef}
          position="sticky"
          top={0}
          zIndex={5}
          bgcolor="background.paper"
          borderBottom="1px solid rgba(0,0,0,0.08)"
        >
          <Tabs
            value={currentTab}
            onChange={(_, next) => selectTab(next as Tab)}
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
                      fontWeight: currentTab === key ? 700 : 500,
                      color: currentTab === key ? '#111' : '#6b6b73',
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
      </Container>
      <ResizeObserverArea
        enabled={isExtendContent}
        onResize={extendViewport}
      >
        <Stack flex={1}>
          {currentTab === 'feed' ? (
            <Container maxWidth="md" sx={{ paddingX: '0px !important' }}>
              <ProfileFeedTab userId={userId} />
            </Container>
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

function waitForScrollEnd<T extends HTMLElement>(element?: T) {
  const { promise, resolve } = Promise.withResolvers<void>();
  const target = element ?? window;
  const timeout = setTimeout(resolve, 300);
  target.addEventListener('scrollend', () => {
    clearTimeout(timeout);
    resolve();
  }, { once: true, passive: true });
  return promise;
}