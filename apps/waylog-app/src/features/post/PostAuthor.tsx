import { useUserProfile } from '@waylog/domains/modules/user-profile'
import { Avatar, Box, Stack, Typography } from '../../shared/components/mui'
import { MaterialIcons } from '@expo/vector-icons'
import { Pressable, type GestureResponderEvent } from 'react-native'
import { palette } from '../../shared/config/tokens'

interface Props {
  authorId: string
  place?: string
  additionalPlaceCount?: number
  onPress?: () => void
}

export function PostAuthor({ authorId, place, additionalPlaceCount = 0, onPress }: Props) {
  const { data: profile } = useUserProfile(authorId)
  const authorName = profile?.name ?? '사용자'

  const handlePress = (event: GestureResponderEvent) => {
    event.stopPropagation()
    onPress?.()
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={onPress == null}
      accessibilityRole={onPress == null ? undefined : 'button'}
      accessibilityLabel={`${authorName} 포스트`}
      style={{ flex: 1, minWidth: 0 }}
    >
      <Stack direction="row" alignItems="center" sx={{ gap: 6, flex: 1 }}>
        <Avatar src={profile?.profileUrl ?? undefined} sx={{ width: 28, height: 28 }}>
          {profile?.name?.[0] ?? '?'}
        </Avatar>
        <Typography sx={{ fontSize: 12, fontWeight: '900', flexShrink: 1 }} numberOfLines={1}>
          {authorName}
        </Typography>
        {place && (
          <>
            <Box sx={{ width: 2, height: 2, borderRadius: 1, backgroundColor: palette.textSecondary }} />
            <Stack direction="row" alignItems="center" sx={{ gap: 2, flex: 1 }}>
              <MaterialIcons name="location-on" size={14} color={palette.textSecondary} />
              <Typography sx={{ color: palette.textSecondary, fontSize: 11, flexShrink: 1 }} numberOfLines={1}>
                {place}{additionalPlaceCount > 0 && ` 외 ${additionalPlaceCount}`}
              </Typography>
            </Stack>
          </>
        )}
      </Stack>
    </Pressable>
  )
}
