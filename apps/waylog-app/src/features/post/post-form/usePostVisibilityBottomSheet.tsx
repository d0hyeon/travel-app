import { PostVisibility, type PostVisibility as PostVisibilityValue } from '@waylog/domains/modules/post'
import { useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { Button, Typography } from '../../../shared/components/mui'
import { palette, radius } from '../../../shared/config/tokens'
import { useOverlay } from '../../../shared/hooks/useOverlay'

export const VISIBILITY_OPTIONS = [
  { value: PostVisibility.PRIVATE, label: '나만 보기' },
  { value: PostVisibility.MEMBERS, label: '여행 멤버' },
  { value: PostVisibility.PUBLIC, label: '전체 공개' },
] as const

const VISIBILITY_DESCRIPTION: Record<PostVisibilityValue, string> = {
  [PostVisibility.PRIVATE]: '본인만 볼 수 있어요',
  [PostVisibility.MEMBERS]: '같이 다녀온 사람들에게만 공개',
  [PostVisibility.PUBLIC]: '누구나 볼 수 있어요',
}

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
        <View style={{ borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg, overflow: 'hidden' }}>
          {VISIBILITY_OPTIONS.map((option) => {
            const disabled = option.value === PostVisibility.MEMBERS && tripId == null
            const selected = option.value === visibility
            return (
              <Pressable
                key={option.value}
                disabled={disabled}
                onPress={() => setVisibility(option.value)}
                style={{
                  minHeight: 56,
                  paddingHorizontal: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: selected ? '#EEF2FF' : palette.background,
                  opacity: disabled ? 0.4 : 1,
                }}
              >
                <Typography variant="body2">{option.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {VISIBILITY_DESCRIPTION[option.value]}
                </Typography>
              </Pressable>
            )
          })}
        </View>
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
