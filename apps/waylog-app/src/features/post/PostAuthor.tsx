import { Box, Stack, Typography } from '~/shared/components/design-system'
import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, Pressable, type GestureResponderEvent } from 'react-native'
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
      style={styles.author}
    >
      <Stack direction="row" alignItems="center" style={styles.authorRow}>
        <UserProfile id={authorId} style={styles.profile} />
        {place && (
          <>
            <Box style={styles.separator} />
            <Stack direction="row" alignItems="center" style={styles.tripRow}>
              <MaterialIcons name="location-on" size={14} color={palette.textSecondary} />
              <Typography style={styles.tripName} numberOfLines={1}>
                {place}{additionalPlaceCount > 0 && ` 외 ${additionalPlaceCount}`}
              </Typography>
            </Stack>
          </>
        )}
      </Stack>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  author: { flex: 1, minWidth: 0 },
  authorRow: { gap: 6, flex: 1 },
  profile: { flexShrink: 1 },
  separator: { width: 2, height: 2, borderRadius: 1, backgroundColor: palette.textSecondary },
  tripRow: { gap: 2, flex: 1 },
  tripName: { color: palette.textSecondary, fontSize: 11, flexShrink: 1 },
})
