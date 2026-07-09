import { Box, Container, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { Scrollable } from '~shared/components/Scrollable'
import { SwitchCase } from '~shared/components/SwitchCase'
import { ExplorerFilters } from './explorer-filters/ExplorerFilters.desktop'
import { ExplorerViewToggleButton, useExplorerViewMode } from './explorer-view/ExplorerViewToggleButton'
import { ExplorerCatalog } from './ExplorerCatalog'
import { ExplorerMap } from './ExplorerMap'

export function PlaceExplorerPage() {
  const [viewMode, setViewMode] = useExplorerViewMode()

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        leftElement={null}
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 0, paddingBottom: 0 }}
      >
        <Typography variant="subtitle1" fontWeight={600}>탐색</Typography>
      </TopNavigation>

      <Stack direction="row" gap={1} alignItems="center" px={2} py={1} borderBottom={1} borderColor="divider" flexShrink={0}>
        <Suspense>
          <ExplorerFilters.LocationChip />
          <ExplorerFilters.CategoryChip />
        </Suspense>
      </Stack>

      <Scrollable.Vertical flex={1} sx={{ overscrollBehaviorY: 'none' }} restorable>
        <Suspense>
          <SwitchCase
            value={viewMode}
            cases={{
              map: () => <ExplorerMap height="100%" />,
              list: () => (
                <Container>
                  <ExplorerCatalog />
                </Container>
              ),
            }}
          />
        </Suspense>
      </Scrollable.Vertical>
    </Box>
  )
}
