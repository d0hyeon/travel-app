import { Box, Stack, Typography } from '~/shared/components/design-system'
import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, type GestureResponderEvent } from 'react-native'
import { palette } from '../../shared/config/tokens'
import { UserProfile } from '../user-profile/UserProfile'

interface Props {
  authorId: string
  place?: string
  additionalPlaceCount?: number
  onPress?: () => void
}

export function PostAuthor({ authorId, place, additionalPlaceCount = 0, onPress }: Props) {
  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation()
    onPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={onPress == null}
      accessibilityRole={onPress == null ? undefined : 'button'}
      accessibilityLabel="작성자 프로필"
      style={{ flex: 1, minWidth: 0 }}
    >
      <Stack direction="row" alignItems="center" style={{ gap: 6, flex: 1 }}>
        <UserProfile id={authorId} style={{ flexShrink: 1 }} />
        {place && (
          <>
            <Box style={{ width: 2, height: 2, borderRadius: 1, backgroundColor: palette.textSecondary }} />
            <Stack direction="row" alignItems="center" style={{ gap: 2, flex: 1 }}>
              <MaterialIcons name="location-on" size={14} color={palette.textSecondary} />
              <Typography style={{ color: palette.textSecondary, fontSize: 11, flexShrink: 1 }} numberOfLines={1}>
                {place}{additionalPlaceCount > 0 && ` 외 ${additionalPlaceCount}`}
              </Typography>
            </Stack>
          </>
        )}
      </Stack>
    </Pressable>
  )
}
