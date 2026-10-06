import { MaterialIcons } from '@expo/vector-icons'
import { useAuth } from '@waylog/domains/clients'
import { usePlaceBookmark } from '@waylog/domains/modules/place-bookmark'
import { Suspense } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { toast } from '~shared/components/toast/toast'
import { useLoginRedirect } from '~features/auth/auth-redirect'
import { palette } from '~shared/config/tokens'
import { impactAsync as haptic, ImpactFeedbackStyle } from 'expo-haptics'


interface Props {
  placeId: string
}

export function PlaceBookmarkButton({ placeId }: Props) {
  return (
    <Suspense fallback={<View style={styles.button} />}>
      <Resolved placeId={placeId} />
    </Suspense>
  )
}

function Resolved({ placeId }: Props) {
  const { data: auth } = useAuth({ required: false })

  const { isBookmarked, toggle } = usePlaceBookmark(placeId)
  const redirectToLogin = useLoginRedirect()

  const handlePress = async () => {
    if (auth == null) return redirectToLogin();
    haptic(ImpactFeedbackStyle.Light).catch(() => { });


    await toggle()
    toast.success(isBookmarked ? '저장을 해제했어요' : '장소를 저장했어요', { position: 'bottom-center' })
  }

  return (
    <Pressable
      accessibilityLabel={isBookmarked ? '장소 저장 해제' : '장소 저장'}
      style={styles.button}
      onPress={handlePress}
    >
      <MaterialIcons name={isBookmarked ? 'bookmark' : 'bookmark-border'} size={22} color={palette.primary} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
