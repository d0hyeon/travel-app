import { MaterialIcons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import { Box, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'

export function CreateTripCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="새 여행 계획하기">
      <Stack direction="row" alignItems="center" justifyContent="space-between" style={{ borderWidth: 1, borderStyle: 'dashed', borderColor: palette.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Box style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </Box>
          <Box>
            <Typography style={{ color: palette.primary, fontSize: 12 }}>다음 여행</Typography>
            <Typography style={{ fontSize: 13, marginTop: 4 }}>어디든 떠나볼까요?</Typography>
            <Typography style={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>새 여행을 계획해보아요</Typography>
          </Box>
        </Stack>
        <MaterialIcons name="chevron-right" size={22} color={palette.textSecondary} />
      </Stack>
    </Pressable>
  )
}
