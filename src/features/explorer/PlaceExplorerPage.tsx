import CheckIcon from '@mui/icons-material/Check'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted'
import MapIcon from '@mui/icons-material/Map'
import {
  Box,
  Chip,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  type BoxProps,
} from '@mui/material'
import { Suspense, useCallback, useRef, useState } from 'react'
import type { Location } from '~features/location'
import type { PlaceCategoryType } from '~features/place/place.types'
import { PlaceCategoryTypeLabel } from '~features/place/place.types'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { Extrude } from '~shared/components/Extrude'
import { TopNavigation } from '~shared/components/layout/TopNavigation.mobile'
import { ListItem } from '~shared/components/ListItem'
import { SwitchCase } from '~shared/components/SwitchCase'
import { ScrollContainerProvider, useScrollContainer } from '~shared/hooks/interaction/useScrollRestore'
import { useScrollStatus } from '~shared/hooks/interaction/useScrollStatus'
import { useOverlay } from '~shared/hooks/useOverlay'
import { EXPLORER_CATEGORY_TYPES } from './explorer.api'
import { ExplorerCatalog, useLocationOverlay } from './ExplorerCatalog'
import { ExplorerMap } from './ExplorerMap'

type ViewMode = 'map' | 'list'

export default function PlaceExplorerPage() {
  const [viewMode, setViewMode] = useExplorerViewMode()
  const [location, setLocation] = useState<Location | null>(null)
  const [category, setCategory] = useState<PlaceCategoryType | null>(null)
  const openLocationOverlay = useLocationOverlay()
  const openCategorySheet = useCategoryBottomSheet(category, setCategory)

  const handleLocationChipClick = async () => {
    const result = await openLocationOverlay(location ?? undefined)
    if (result !== undefined) setLocation(result)
  }

  const chipSx = { fontSize: 11, height: 26 };
  const titleRef = useRef(null)

  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { isScrollDown } = useScrollStatus(container);

  return (
    <Box height="100%" display="flex" flexDirection="column" bgcolor="background.paper">
      <TopNavigation
        position="sticky"
        leftElement={null}
        rightElement={<ExplorerViewToggleButton value={viewMode} onChange={setViewMode} />}
        sx={{ borderBottom: 'none' }}
      >
        <Box ref={titleRef} paddingX={1}>
          탐색
        </Box>
      </TopNavigation>

      <FilterNavigation
        sx={{ zIndex: 1000, transition: 'all 200ms', position: 'fixed', top: TopNavigation.HEIGHT }}
        paddingBottom={isScrollDown ? 0 : 1}
        height={isScrollDown ? 0 : 'auto'}
      >
        <Extrude active={isScrollDown} target={titleRef.current} axis="y">
          <Stack direction="row" gap={1} alignItems="center">
            <Chip
              label={location ?? '지역'}
              onClick={handleLocationChipClick}
              color={location ? 'primary' : 'default'}
              variant="outlined"
              size="small"
              sx={{ ...chipSx, fontWeight: location ? 700 : 400 }}
            />
            <Chip
              label={category ? PlaceCategoryTypeLabel[category] : '카테고리'}
              onClick={openCategorySheet}
              color={category ? 'primary' : 'default'}
              variant="outlined"
              size="small"
              sx={{ ...chipSx, fontWeight: category ? 700 : 400 }}
            />
          </Stack>
        </Extrude>
      </FilterNavigation>
      <ScrollContainerProvider value={container}>
        <Box ref={setContainer} flex={1} height="100%" position="relative" paddingTop={`${FilterNavigation.height}px`} overflow="auto">
          <Suspense>
            <SwitchCase
              value={viewMode}
              cases={{
                map: () => <ExplorerMap height="100%" />,
                list: () => <ExplorerCatalog location={location} category={category} />,
              }}
            />
          </Suspense>
        </Box>
      </ScrollContainerProvider>
    </Box>
  )
}

function useCategoryBottomSheet(
  category: PlaceCategoryType | null,
  onSelect: (v: PlaceCategoryType | null) => void,
) {
  const overlay = useOverlay()

  return useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <BottomSheet isOpen={isOpen} onClose={close}>
        <BottomSheet.Header>카테고리 선택</BottomSheet.Header>
        <BottomSheet.Body>
          <Stack gap={1} pb={1}>
            <ListItem.Button
              onClick={() => { onSelect(null); close() }}
              rightAddon={
                category === null
                  ? <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                  : undefined
              }
              sx={{ border: 'none' }}
            >
              <ListItem.Title fontWeight={category === null ? 700 : 400}>
                전체
              </ListItem.Title>
            </ListItem.Button>
            {EXPLORER_CATEGORY_TYPES.map((cat) => (
              <ListItem.Button
                key={cat}
                onClick={() => { onSelect(cat); close() }}
                rightAddon={
                  category === cat
                    ? <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    : undefined
                }
                sx={{ border: 'none' }}
              >
                <ListItem.Title fontWeight={category === cat ? 700 : 400}>
                  {PlaceCategoryTypeLabel[cat]}
                </ListItem.Title>
              </ListItem.Button>
            ))}
          </Stack>
        </BottomSheet.Body>
      </BottomSheet>
    ))
  }, [overlay, category, onSelect])
}

type ToggleButtonProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}
function ExplorerViewToggleButton({ value, onChange }: ToggleButtonProps) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, value: ViewMode) => onChange(value)}
      size="small"
      sx={theme => ({
        backgroundColor: theme.palette.grey[200],
        padding: 0.5,
        borderRadius: '12px',
        '& .MuiToggleButton-root': { border: 'none', px: 1 },
        '.Mui-selected': { backgroundColor: '#fff !important' },
        '.MuiButtonBase-root': { borderRadius: '8px', paddingY: 0.5, }
      })}

    >
      <ToggleButton value="list" aria-label="리스트 뷰" >
        <FormatListBulletedIcon fontSize="small" />
      </ToggleButton>
      <ToggleButton value="map" aria-label="지도 뷰">
        <MapIcon fontSize="small" />
      </ToggleButton>
    </ToggleButtonGroup>
  )
}

function useExplorerViewMode() {
  return useState<ViewMode>('list');
}

function FilterNavigation(props: BoxProps) {
  return (
    <Box
      width="100%"
      height={FilterNavigation.height}
      paddingX={2}
      borderBottom={1}
      borderColor="divider"
      bgcolor="#fff"
      {...props}
    />
  )
}
FilterNavigation.height = 35