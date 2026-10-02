import { useTrip } from '@waylog/domains/modules/trip'
import { useAppNavigation, useAppRoute } from '../../../shared/hooks/useAppNavigation'
import { AppRoute } from '../../../app/AppRoute'
import { StyleSheet, Pressable, type TextProps } from 'react-native'
import Animated, { interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense, type ReactNode } from 'react'
import { Box, GlassSurface, Skeleton, Stack } from '~/shared/components/design-system'
import { palette } from '../../../shared/config/tokens'
import { ChatIconButton } from '../trip-chat/ChatIconButton'
import { EditableText } from '../../../shared/components/EditableText'
import { useTripLayout } from '../trip-layout/TripLayout'

const AnimatedGlassSurface = Animated.createAnimatedComponent(GlassSurface)
const AnimatedMaterialIcons = Animated.createAnimatedComponent(MaterialIcons)

const GLASS_BUTTON_BLUR_INTENSITY = 20
const GLASS_BUTTON_TINT = 'rgba(255,255,255,0.3)'
const GLASS_BUTTON_SIZE = 44
const GLASS_BUTTON_HIDDEN_SCALE = 0.6
const TITLE_SHADOW_COLOR = 'rgba(0,0,0,0.7)'
const TITLE_SHADOW_HIDDEN = 'rgba(0,0,0,0)'

export function TripDetailHeader() {
  return (
    <Suspense fallback={<TripDetailHeaderSkeleton />}>
      <Resolved />
    </Suspense>
  )
}

function TripDetailHeaderSkeleton() {
  return (
    <Stack direction="row" alignItems="center" style={styles.header}>
      <Box style={styles.iconPlaceholder} />
      <Stack style={styles.titleSlot}>
        <Skeleton variant="text" style={styles.titlePlaceholder} />
      </Stack>
      <Box style={styles.iconPlaceholder} />
    </Stack>
  )
}

function Resolved() {
  const { params } = useAppRoute<typeof AppRoute.여행_상세>()
  const { tripId } = params
  const navigation = useAppNavigation()
  const { data: trip, update } = useTrip(tripId)
  const { glassProgress } = useTripLayout()
  const editIconColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(glassProgress.get(), [0, 1], [palette.grey, palette.onPrimary]),
  }))

  return (
    <Stack direction="row" alignItems="center" style={styles.header}>
      <GlassButtonSlot>
        <Pressable accessibilityLabel="뒤로가기" onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={palette.text} />
        </Pressable>
      </GlassButtonSlot>
      <Stack style={styles.titleSlot}>
        <EditableText
          value={trip.name}
          variant="subtitle2"
          as={ShadeAwareText}
          endIcon={<AnimatedMaterialIcons name="edit" size={15} style={editIconColorStyle} />}
          onSubmit={async (name) => {
            await update({ name: name.trim() })
          }}
        />
      </Stack>
      <GlassButtonSlot>
        <ChatIconButton tripId={tripId} />
      </GlassButtonSlot>
    </Stack>
  )
}

function ShadeAwareText(props: TextProps) {
  const { glassProgress } = useTripLayout()
  const colorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(glassProgress.get(), [0, 1], [palette.text, palette.onPrimary]),
    textShadowColor: interpolateColor(glassProgress.get(), [0, 1], [TITLE_SHADOW_HIDDEN, TITLE_SHADOW_COLOR]),
  }))

  return <Animated.Text {...props} style={[props.style, styles.titleShadow, colorStyle]} />
}

function GlassButtonSlot({ children }: { children: ReactNode }) {
  const { glassProgress } = useTripLayout()
  const glassStyle = useAnimatedStyle(() => ({
    opacity: glassProgress.get(),
    transform: [{ scale: interpolate(glassProgress.get(), [0, 1], [GLASS_BUTTON_HIDDEN_SCALE, 1]) }],
  }))

  return (
    <Box style={styles.buttonSlot}>
      <AnimatedGlassSurface
        style={[styles.buttonGlass, glassStyle]}
        fallbackBlurIntensity={GLASS_BUTTON_BLUR_INTENSITY}
        tintColor={GLASS_BUTTON_TINT}
        glassStyle="clear"
        pointerEvents="none"
      />
      {children}
    </Box>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingVertical: 8 },
  iconPlaceholder: { width: 22, height: 22, marginHorizontal: 4 },
  titleSlot: { flex: 1, marginHorizontal: 8, alignItems: 'flex-start' },
  titlePlaceholder: { width: '50%' },
  backButton: { padding: 4 },
  titleShadow: { textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  buttonSlot: { width: GLASS_BUTTON_SIZE, height: GLASS_BUTTON_SIZE, alignItems: 'center', justifyContent: 'center' },
  buttonGlass: { ...StyleSheet.absoluteFill, borderRadius: GLASS_BUTTON_SIZE / 2, overflow: 'hidden' },
})
