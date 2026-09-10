import { Pressable, PressableProps, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { MaterialIcons } from '@expo/vector-icons'
import type { Route } from '@waylog/domains/modules/route'
import { Chip } from '~/shared/components/design-system'
import { palette, zLayer } from '../../../shared/config/tokens'
import { ReactNode, useRef } from 'react'
import { useDayTripRoutes } from '@waylog/domains/modules/trip'
import { useConfirmDialog } from '../../../shared/components/confirm-dialog/useConfirmDialog';
import { useQueryClient } from '@tanstack/react-query'

interface TripRouteConfigToolbarProps {
  tripId: string;
  date: string;
  value: string;

  onSelect: (id: string) => void
  onAdd?: (route: Route) => void
  onDelete?: (id: string) => void;
  rightAddon?: ReactNode;

}

export function TripRouteConfigToolbar({
  tripId,
  date,
  value,
  rightAddon,
  onSelect,
  onAdd,
  onDelete
}: TripRouteConfigToolbarProps) {
  const { data: { routes }, create, remove } = useDayTripRoutes({ tripId, date });
  const confirm = useConfirmDialog();
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  return (
    <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(140)} style={styles.toolbar}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.routeList}
        contentContainerStyle={styles.routeChips}
      >
        {routes.map((route, index) => {
          const isSelected = value === route.id
          const label = route.name?.trim() || `경로 ${index + 1}`

          return (
            <View key={route.id} style={styles.routeButton}>
              <Chip
                label={label}
                variant={isSelected ? 'filled' : 'outlined'}
                color={isSelected ? 'primary' : 'default'}
                onPress={() => onSelect(route.id)}
                onDelete={async () => {
                  if (await confirm('삭제하시겠어요?')) {
                    await remove(route.id);
                    onDelete?.(route.id);
                  }
                }}
              />
            </View>
          )
        })}
      </ScrollView>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="경로 추가"
        accessibilityState={{ disabled: create.isPending, busy: create.isPending }}
        disabled={create.isPending}
        onPress={async () => {
          const payload = { tripId, name: `경로 ${routes.length + 1}`, scheduledDate: date, };

          await create(payload, {
            onSuccess: (route) => onAdd?.(route)
          })
          await queryClient.invalidateQueries({ queryKey: useDayTripRoutes.key(tripId) })
          requestAnimationFrame(() => scrollViewRef.current?.scrollToEnd())
        }}
        style={[styles.actionButton, create.isPending && styles.disabledButton]}
      >
        <MaterialIcons name="add" size={24} color={palette.primary} />
      </Pressable>
      {rightAddon}
    </Animated.View>
  )
}

TripRouteConfigToolbar.CloseButton = (props: PressableProps) => {
  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      accessibilityLabel="경로 관리 닫기"
      style={styles.actionButton}
    >
      <MaterialIcons name="close" size={22} color={palette.textSecondary} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: zLayer.mapFab,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 16,
    backgroundColor: palette.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  routeList: { flex: 1 },
  routeChips: { alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  routeButton: { minHeight: 44, minWidth: 44, justifyContent: 'center' },
  actionButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  disabledButton: { opacity: 0.4 },
})
