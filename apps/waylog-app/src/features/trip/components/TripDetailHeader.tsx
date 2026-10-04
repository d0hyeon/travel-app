import { useTrip } from '@waylog/domains/modules/trip'
import { useAppNavigation, useAppRoute } from '~shared/hooks/useAppNavigation'
import { AppRoute } from '~app/AppRoute'
import { StyleSheet, Pressable, type StyleProp, type TextProps, type ViewStyle } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  LinearTransition,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { MaterialIcons } from '@expo/vector-icons'
import { Suspense, type ReactNode } from 'react'
import { Box, GlassSurface, Skeleton, Stack } from '~shared/components/design-system'
import { palette } from '~shared/config/tokens'
import { ChatIconButton } from '~features/trip/trip-chat/ChatIconButton'
import { EditableText } from '~shared/components/EditableText'
import { useTripLayout } from '~features/trip/trip-layout/TripLayout'

const AnimatedGlassSurface = Animated.createAnimatedComponent(GlassSurface)
const AnimatedMaterialIcons = Animated.createAnimatedComponent(MaterialIcons)

const GLASS_BUTTON_BLUR_INTENSITY = 20
const GLASS_BUTTON_TINT = 'rgba(255,255,255,0.3)'
const GLASS_BUTTON_SIZE = 44
const GLASS_BUTTON_HIDDEN_SCALE = 0.6
const GLASS_BUTTON_PADDING_X = 4
const GLASS_BUTTON_PADDING_X_WITH_ACTIONS = 10
const ACTIONS_MOTION_DURATION = 220
const TITLE_SHADOW_COLOR = 'rgba(0,0,0,0.5)'
const TITLE_SHADOW_HIDDEN = 'rgba(0,0,0,0)'
const TITLE_FONT_SIZE = 15
const TITLE_LINE_HEIGHT = 20
const TITLE_FONT_SIZE_GLASS = 18
const TITLE_LINE_HEIGHT_GLASS = 26
const TITLE_PLATE_PADDING_X = 16

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
  const { glassProgress, actions } = useTripLayout()
  const editIconColorStyle = useAnimatedStyle(() => ({
    color: interpolateColor(glassProgress.get(), [0, 1], [palette.grey, '#000']),
  }))

  return (
    <Stack direction="row" alignItems="center" style={styles.header}>
      <GlassButtonSlot>
        <Pressable accessibilityLabel="뒤로가기" onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={palette.text} />
        </Pressable>
      </GlassButtonSlot>
      <Stack style={styles.titleSlot}>
        <TitlePlate>
          <EditableText
            value={trip.name}
            variant="body1"
            as={ShadeAwareText}
            endIcon={<AnimatedMaterialIcons name="edit" size={15} style={editIconColorStyle} />}
            onSubmit={async (name) => {
              await update({ name: name.trim() })
            }}
          />
        </TitlePlate>
      </Stack>
      <GlassButtonSlot style={actions != null ? styles.buttonSlotWithActions : undefined}>
        <ChatIconButton tripId={tripId} />
        {actions != null && (
          <Animated.View
            entering={ZoomIn.duration(ACTIONS_MOTION_DURATION)}
            exiting={ZoomOut.duration(ACTIONS_MOTION_DURATION)}
            style={styles.actions}
          >
            <Box style={styles.actionDivider} />
            {actions}
          </Animated.View>
        )}
      </GlassButtonSlot>
    </Stack>
  )
}

function TitlePlate({ children }: { children: ReactNode }) {
  const { glassProgress } = useTripLayout()
  const plateStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(glassProgress.get(), [0, 1], [0, TITLE_PLATE_PADDING_X]),
  }))
  const glassStyle = useAnimatedStyle(() => ({ opacity: glassProgress.get() }))

  return (
    <Animated.View style={[styles.titlePlate, plateStyle]}>
      <AnimatedGlassSurface
        style={[styles.titleGlass, glassStyle]}
        fallbackBlurIntensity={GLASS_BUTTON_BLUR_INTENSITY}
        tintColor={GLASS_BUTTON_TINT}
        glassStyle="clear"
        pointerEvents="none"
      />
      {children}
    </Animated.View>
  )
}

function ShadeAwareText(props: TextProps) {
  const { glassProgress } = useTripLayout();


  const fontStyle = useAnimatedStyle(() => ({
    color: interpolateColor(glassProgress.get(), [0, 1], [palette.text, '#1A2B4C']),
    // textShadowColor: interpolateColor(glassProgress.get(), [0, 1], [TITLE_SHADOW_HIDDEN, TITLE_SHADOW_COLOR]),
    // fontSize: interpolate(glassProgress.get(), [0, 1], [TITLE_FONT_SIZE, TITLE_FONT_SIZE_GLASS]),
    // lineHeight: interpolate(glassProgress.get(), [0, 1], [TITLE_LINE_HEIGHT, TITLE_LINE_HEIGHT_GLASS]),
  }))

  return <Animated.Text {...props} style={[props.style, fontStyle]} />
}

function GlassButtonSlot({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { glassProgress } = useTripLayout()
  const glassStyle = useAnimatedStyle(() => ({
    opacity: glassProgress.get(),
    transform: [{ scale: interpolate(glassProgress.get(), [0, 1], [GLASS_BUTTON_HIDDEN_SCALE, 1]) }],
  }))

  return (
    <Animated.View layout={LinearTransition.duration(ACTIONS_MOTION_DURATION)} style={[styles.buttonSlot, style]}>
      <AnimatedGlassSurface
        style={[styles.buttonGlass, glassStyle]}
        fallbackBlurIntensity={GLASS_BUTTON_BLUR_INTENSITY}
        tintColor={GLASS_BUTTON_TINT}
        glassStyle="clear"
        pointerEvents="none"
      />
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 12, paddingVertical: 8 },
  iconPlaceholder: { width: 22, height: 22, marginHorizontal: 4 },
  titleSlot: { flex: 1, marginHorizontal: 8, alignItems: 'flex-start' },
  titlePlaceholder: { width: '50%' },
  backButton: { padding: 4 },
  titlePlate: { height: GLASS_BUTTON_SIZE, flexShrink: 1, justifyContent: 'center', borderRadius: GLASS_BUTTON_SIZE / 2, overflow: 'hidden' },
  titleGlass: { ...StyleSheet.absoluteFill },
  titleShadow: { textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  buttonSlot: { minWidth: GLASS_BUTTON_SIZE, height: GLASS_BUTTON_SIZE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: GLASS_BUTTON_PADDING_X },
  buttonSlotWithActions: { paddingLeft: GLASS_BUTTON_PADDING_X_WITH_ACTIONS },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6, paddingRight: 4 },
  actionDivider: { width: StyleSheet.hairlineWidth, height: 20, backgroundColor: palette.grey },
  buttonGlass: { ...StyleSheet.absoluteFill, borderRadius: GLASS_BUTTON_SIZE / 2, overflow: 'hidden' },
})
