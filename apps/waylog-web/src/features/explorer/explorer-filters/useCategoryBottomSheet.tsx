import CheckIcon from '@mui/icons-material/Check'
import { Stack } from '@mui/material'
import { useCallback } from 'react'
import type { PlaceCategoryType } from '@waylog/domains/place'
import { PlaceCategoryTypeLabel } from '@waylog/domains/place'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '~shared/components/ListItem'
import { useOverlay } from '~shared/hooks/useOverlay'
import { EXPLORER_CATEGORY_TYPES } from '../explorer.api'

export function useCategoryBottomSheet() {
  const overlay = useOverlay()

  return useCallback((category?: PlaceCategoryType) => {
    return new Promise<PlaceCategoryType | null>((resolve) => {
      overlay.open(({ isOpen, close }) => (
        <BottomSheet isOpen={isOpen} onClose={close}>
          <BottomSheet.Header>카테고리 선택</BottomSheet.Header>
          <BottomSheet.Body>
            <Stack gap={1} pb={1}>
              <ListItem.Button
                onClick={() => {
                  resolve(null);
                  close()
                }}
                rightAddon={category === null ? <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} /> : undefined}
                sx={{ border: 'none' }}
              >
                <ListItem.Title fontWeight={category === null ? 700 : 400}>전체</ListItem.Title>
              </ListItem.Button>
              {EXPLORER_CATEGORY_TYPES.map((cat) => (
                <ListItem.Button
                  key={cat}
                  onClick={() => {
                    resolve(cat);
                    close();
                  }}
                  rightAddon={category === cat ? <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} /> : undefined}
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
    })

  }, [overlay])
}
