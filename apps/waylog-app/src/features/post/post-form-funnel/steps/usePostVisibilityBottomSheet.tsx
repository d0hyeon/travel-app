import type { PostVisibility as PostVisibilityValue } from '@waylog/domains/modules/post'
import { useCallback, useState } from 'react'
import { BottomSheet } from '../../../../shared/components/bottom-sheet/BottomSheet'
import { Button } from '~/shared/components/design-system'
import { useOverlay } from '../../../../shared/hooks/useOverlay'
import { PostVisibilityField, VISIBILITY_OPTIONS } from './PostVisibilityField'

export { VISIBILITY_OPTIONS }

interface OpenParams {
  tripId: string | null
  defaultValue: PostVisibilityValue
}

// 확인해야 반영된다. 시트가 자기 선택을 들고 있다가 확인 시에만 넘긴다.
export function usePostVisibilityBottomSheet() {
  const overlay = useOverlay()

  const open = useCallback(
    ({ tripId, defaultValue }: OpenParams) => {
      return new Promise<PostVisibilityValue | null>((resolve) => {
        overlay.open(({ isOpen, close }) => {
          const cancel = () => {
            resolve(null)
            close()
          }

          return (
            <PostVisibilitySheet
              isOpen={isOpen}
              tripId={tripId}
              defaultValue={defaultValue}
              onCancel={cancel}
              onConfirm={(visibility) => {
                resolve(visibility)
                close()
              }}
            />
          )
        })
      })
    },
    [overlay],
  )

  return { open }
}

function PostVisibilitySheet({
  isOpen,
  tripId,
  defaultValue,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean
  tripId: string | null
  defaultValue: PostVisibilityValue
  onCancel: () => void
  onConfirm: (visibility: PostVisibilityValue) => void
}) {
  const [visibility, setVisibility] = useState(defaultValue)

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onCancel} snapPoints={[0.48]} safeArea>
      <BottomSheet.Header>공개 범위</BottomSheet.Header>
      <BottomSheet.Body sx={{ paddingHorizontal: 16 }}>
        <PostVisibilityField defaultValue={visibility} onChange={setVisibility} hasTripContext={tripId != null} />
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        <Button variant="outlined" fullWidth onClick={onCancel}>
          취소
        </Button>
        <Button variant="contained" fullWidth onClick={() => onConfirm(visibility)}>
          확인
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
