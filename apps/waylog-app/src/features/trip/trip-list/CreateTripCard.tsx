import { MaterialIcons } from '@expo/vector-icons'
import { Pressable } from 'react-native'
import { Box, Stack, Typography } from '../../../shared/components/mui'
import { palette } from '../../../shared/config/tokens'

export function CreateTripCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="새 여행 계획하기">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ borderWidth: 1, borderStyle: 'dashed', borderColor: palette.primary, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16 }}>
        <Stack direction="row" alignItems="center" gap={16}>
          <Box sx={{ width: 30, height: 30, borderRadius: 8, backgroundColor: palette.primary, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </Box>
          <Box>
            <Typography sx={{ color: palette.primary, fontSize: 12 }}>다음 여행</Typography>
            <Typography sx={{ fontSize: 13, marginTop: 4 }}>어디든 떠나볼까요?</Typography>
            <Typography sx={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>새 여행을 계획해보아요</Typography>
          </Box>
        </Stack>
        <MaterialIcons name="chevron-right" size={22} color={palette.textSecondary} />
      </Stack>
    </Pressable>
  )
}
