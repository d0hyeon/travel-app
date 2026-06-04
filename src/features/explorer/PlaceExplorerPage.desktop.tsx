import { Box, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { TopNavigation } from '~shared/components/layout/TopNavigation.desktop'
import { SwitchCase } from '~shared/components/SwitchCase'
import { ExplorerFilterDesktop } from './explorer-filters/ExplorerFilters.desktop'
import { ExplorerViewToggleButton, useExplorerViewMode } from './explorer-view/ExplorerViewToggleButton'
import { ExplorerCatalog } from './ExplorerCatalog'
import { ExplorerMap } from './ExplorerMap'

export function PlaceExplorerPageDesktop() {
  const [viewMode, setViewMode] = useExplorerViewMode()

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        leftElement={null}
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
      >
        <Typography variant="subtitle1" fontWeight={600}>탐색</Typography>
      </TopNavigation>

      <Stack
        direction="row"
        gap={1}
        alignItems="center"
        px={2}
        py={1}
        borderBottom={1}
        borderColor="divider"
        flexShrink={0}
      >
        <Suspense>
          <ExplorerFilterDesktop.LocationChip />
          <ExplorerFilterDesktop.CategoryChip />
        </Suspense>
      </Stack>

      <Box flex={1} overflow="auto" sx={{ overscrollBehaviorY: 'none' }}>
        <Suspense>
          <SwitchCase
            value={viewMode}
            cases={{
              map: () => <ExplorerMap height="100%" />,
              list: () => <ExplorerCatalog />,
            }}
          />
        </Suspense>
      </Box>
    </Box>
  )
}
