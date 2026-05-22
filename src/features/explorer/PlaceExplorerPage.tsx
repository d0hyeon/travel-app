import {
  Box,
  Stack
} from '@mui/material'
import { Suspense, useRef, useState } from 'react'
import { Extrude } from '~shared/components/Extrude'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { SwitchCase } from '~shared/components/SwitchCase'
import { useScrollStatus } from '~shared/hooks/interaction/useScrollStatus'
import { ExplorerFilter } from './explorer-filters/ExplorerFilters'
import { useExplorerFilterParams } from './explorer-filters/useExplorerFilterParams'
import { ExplorerViewToggleButton, useExplorerViewMode } from './explorer-view/ExplorerViewToggleButton'
import { FilterNavigation } from './explorer-view/FilterNavigation'
import { ExplorerCatalog } from './ExplorerCatalog'
import { ExplorerMap } from './ExplorerMap'

export default function PlaceExplorerPage() {
  const [viewMode, setViewMode] = useExplorerViewMode()
  const { category, location } = useExplorerFilterParams();

  const titleRef = useRef(null)
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const { isScrollDown } = useScrollStatus(container)

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        position="sticky"
        leftElement={null}
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 'none' }}
      >
        <Box ref={titleRef} paddingX={1}>탐색</Box>
      </TopNavigation>

      <FilterNavigation
        height={isScrollDown ? 0 : 'auto'}
        paddingBottom={isScrollDown ? 0 : 1}
        sx={{ zIndex: 1000, transition: 'all 200ms', position: 'fixed', top: TopNavigation.HEIGHT }}
      >
        <Extrude active={isScrollDown} target={titleRef.current} axis="y">
          <Stack direction="row" gap={1} alignItems="center">
            <ExplorerFilter.LocationChip />
            <ExplorerFilter.CategoryChip />
          </Stack>
        </Extrude>
      </FilterNavigation>

      <Box
        ref={setContainer}
        flex={1}
        height="100%"
        position="relative"
        paddingTop={`${FilterNavigation.height}px`}
        overflow="auto"
        sx={{ overscrollBehaviorY: 'none' }}
      >
        <Suspense>
          <SwitchCase
            value={viewMode}
            cases={{
              map: () => <ExplorerMap height="100%" />,
              list: () => <ExplorerCatalog location={location ?? undefined} category={category ?? undefined} />,
            }}
          />
        </Suspense>
      </Box>
    </Box>
  )
}
