import { MaterialIcons } from '@expo/vector-icons'
import { PlaceCategoryColorCode } from '@waylog/domains/modules/place'
import { TransportTypeLabel } from '@waylog/domains/modules/transport'
import { findNearestPlace, useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import { useVariation } from '@waylog/react'
import { formatDisplayDate, formatDuration, formatShortDate } from '@waylog/utility'
import { Fragment, Suspense, useEffect, useRef, useState } from 'react'
import { StyleSheet } from 'react-native'
import { View } from 'tamagui'
import { Box, MenuFab, Skeleton, Stack, Tab, Tabs, Typography } from '~shared/components/design-system'
import { getItemOffsetY, ITEM_HEIGHT } from '~shared/components/design-system/menu-fab/menuFabMotion'
import { FLOATING_TAB_BAR_RESERVE } from '~shared/components'
import { ActionSheet } from '~shared/components/action-sheet/ActionSheet'
import { BottomSheet } from '~shared/components/bottom-sheet/BottomSheet'
import { SortableItem, SortableList, type SortableListRef } from '~shared/components/dnd/SortableList'
import { Map, type MapRef } from '~shared/components/Map'
import { palette } from '~shared/config/tokens'
import { useCurrentCoordinate } from '~shared/hooks/env/useCurrentCoordinate'
import { useOverlay } from '~shared/hooks/useOverlay'
import { FloatingControl } from '~features/trip/components/FloatingControl'
import { getRouteColor } from '~features/trip/trip-expense/routeExpenseView.utils'
import { useTripLayoutSetting } from '~features/trip/trip-layout/useTripLayoutSetting'
import { TripMarineActivityMapMarkers } from '~features/trip/trip-marine-activity/TripMarineActivityMapMarkers'
import { useTripPlaceFormOverlay } from '~features/trip/trip-place/trip-place-form/useTripPlaceFormOverlay'
import { TripWeatherIconButton } from '~features/trip/trip-weather/TripWeatherIconButton'
import { CurrenntLocationIconButton } from './components/CurrentLocationIconButton'
import { TripRouteMapSettingsButton } from './components/TripRouteMapSettingsButton'
import { TripRoutePlaceListItem } from './components/TripRoutePlaceListItem'
import { TripRouteConfigToolbar } from './trip-route-configuration/TripRouteConfigToolbar'
import { useActiveTripDay } from './trip-route-configuration/useActiveTripDay'
import { useTripViewConfigValue } from './trip-route-configuration/useTripViewConfig'
import { RouteLegItem } from './trip-route-leg/RouteLegItem'
import { usePlaceSelectSheet } from './trip-route-place/usePlaceSelectSheet'
import { useTripRoutePlaces } from './useTripRoutePlaces'

const BOTTOM_SHEET_RATIOS = [0.4, 0.55, 0.7, 0.85] as const;
const DEFAULT_BOTTOM_SHEET_RATIO = 0.55 satisfies typeof BOTTOM_SHEET_RATIOS[number];
const MIN_MAP_MENU_HEIGHT = getItemOffsetY(1) + ITEM_HEIGHT + 32

interface RouteContentProps {
  tripId: string
}

export default function TripRoutesContent({ tripId }: RouteContentProps) {
  return (
    <Suspense fallback={<Pending />}>
      <Resolved tripId={tripId} />
    </Suspense>
  )
}

function Pending() {
  useTripLayoutSetting({ variant: 'glass', actions: <TripRouteMapSettingsButton /> })

  return (
    <Box style={styles.container}>
      <Box style={styles.pendingSheet}>
        <Stack gap={1.5}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} variant="rounded" height={64} />
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

function Resolved({ tripId }: RouteContentProps) {
  const { data: trip } = useTrip(tripId)
  const { data: allPlaces } = useTripPlaces(tripId)

  const { value: selectedDate, update: setSelectedDate } = useActiveTripDay(tripId)
  const {
    data: { routes, tripDates, currentRoute, currentPlaces, legs: legByArrivalPlaceId },
    setRouteId,
    update,
  } = useTripRoutePlaces({ tripId, date: selectedDate })

  const viewConfig = useTripViewConfigValue()
  const mapRef = useRef<MapRef>(null)
  const overlay = useOverlay()
  const { headerInset } = useTripLayoutSetting({ variant: 'glass', actions: <TripRouteMapSettingsButton /> })


  // 여행 중이면 현재 위치로 이동하고 가장 가까운 장소를 잡아준다.
  const today = formatDisplayDate(new Date())
  const isOngoingTrip = trip.startDate <= today && today <= trip.endDate
  const [getIsInitialzed, setIsInitialized] = useVariation(false);

  const currentCoordinate = useCurrentCoordinate({
    enabled: isOngoingTrip,
    onChange: (coordinate) => {
      if (getIsInitialzed()) return;
      mapRef.current?.panTo(coordinate.lat, coordinate.lng, { paddingTop: headerInset })
      if (selectedDate === today) {
        const nearestPlace = findNearestPlace(coordinate, currentRoute?.places ?? [])
        if (nearestPlace != null) setFocusedId(nearestPlace.id)
      }
      setIsInitialized(true);
    },
  })

  const listRef = useRef<SortableListRef>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  useEffect(() => {
    if (focusedId != null) listRef.current?.scrollToItem(focusedId);
  }, [focusedId])

  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isRouteToolbarOpen, setIsRouteToolbarOpen] = useState(false)
  const visibleMapHeight = containerHeight * (1 - sheetRatio) - headerInset
  const canShowRouteMenu = visibleMapHeight >= MIN_MAP_MENU_HEIGHT

  const { open: selectPlaces } = usePlaceSelectSheet(tripId);

  const addPlaces = async () => {
    if (currentRoute == null) return;

    const selected = await selectPlaces({ defaultValue: currentRoute.placeIds });
    if (selected) {
      update({
        routeId: currentRoute.id,
        placeIds: [...currentRoute.placeIds, ...selected]
      });
    }
  }

  const { openBottomSheet: editPlace } = useTripPlaceFormOverlay()

  return (
    <>
      <Box style={styles.container} onLayout={({ nativeEvent }) => setContainerHeight(nativeEvent.layout.height)}>
        <Box pointerEvents="box-none" style={[styles.topOverlay, { top: headerInset }]}>
          {isRouteToolbarOpen && (
            <TripRouteConfigToolbar
              tripId={tripId}
              date={selectedDate}
              value={currentRoute.id}
              onSelect={setRouteId}
              onAdd={(route) => setRouteId(route.id)}
              onDelete={(id) => {
                if (currentRoute.id === id) {
                  const index = routes.findIndex(x => x.id === id);
                  setRouteId(routes[index - 1].id);
                }
              }}
              rightAddon={
                <TripRouteConfigToolbar.CloseButton onPress={() => setIsRouteToolbarOpen(false)} />
              }
            />
          )}
          <FloatingControl corner="top-left" zIndex={8}>
            <TripWeatherIconButton tripId={tripId} />
          </FloatingControl>
        </Box>
        {currentCoordinate != null && (
          <FloatingControl corner="bottom-left" zIndex={8} style={{ bottom: `${sheetRatio * 100}%` }}>
            <CurrenntLocationIconButton
              onPress={() => mapRef.current?.panTo(currentCoordinate.lat, currentCoordinate.lng, { paddingTop: headerInset })}
              style={styles.mapControl}
            />
          </FloatingControl>
        )}
        {/* 웹은 calc(%-10px) 를 쓰지만 RN 은 계산식을 못 읽는다. 비율만 남긴다. */}
        <Box style={[styles.mapArea, { bottom: `${sheetRatio * 100}%` }]}>
          <Map
            ref={mapRef}
            defaultCenter={currentCoordinate ?? { lat: trip.lat, lng: trip.lng }}
            autoFocus="path"
            clustering={viewConfig.isCluasterlingView}
            clusterGridSize={50}
          >
            {/* 날짜별로 suspend 한다. 경계가 없으면 탭 경계까지 올라가
                지도까지 폴백으로 바뀌며 보던 위치가 초기화된다. */}
            <Suspense fallback={null}>
              <TripMarineActivityMapMarkers tripId={trip.id} />
            </Suspense>
            {isOngoingTrip && currentCoordinate != null && (
              <Map.Marker id="current-location" variant="circle" lat={currentCoordinate.lat} lng={currentCoordinate.lng} />
            )}
            <Map.Polyline
              key={`route_${currentRoute.id}`}
              strokeColor={getRouteColor(0)}
              strokeWeight={5}
              strokeOpacity={1}
            >
              {Object.values(legByArrivalPlaceId).map((leg, legIndex) => (
                <Map.Polyline.Line
                  key={`route_${currentRoute.id}_leg_${legIndex}`}
                  coordinates={leg.coordinates}
                  label={
                    viewConfig.isVisibleRouteLegs
                      ? `${legIndex + 1}. ${TransportTypeLabel[leg.transport]} ${formatDuration(leg.duration)}`
                      : undefined
                  }
                />
              ))}
            </Map.Polyline>
            {allPlaces.flatMap((place) => {
              const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false
              const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1

              if (!viewConfig.isVisibleAllMarkers && !isInCurrentRoute) return null

              return (
                <Map.Marker
                  key={place.id}
                  lat={place.lat}
                  lng={place.lng}
                  label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                  color={isInCurrentRoute && place.category ? PlaceCategoryColorCode[place.category] : 'disabled'}
                  onPress={() => {
                    if (isInCurrentRoute) {
                      setFocusedId(place.id)
                      mapRef.current?.panTo(place.lat, place.lng, { paddingTop: headerInset })
                    }
                    overlay.open(({ isOpen, close }) => (
                      <ActionSheet isOpen={isOpen} onClose={close}>
                        <ActionSheet.Item
                          onPress={() => editPlace({ tripId, placeId: place.id })}
                        >
                          장소 수정
                        </ActionSheet.Item>
                        {currentRoute != null && (
                          <ActionSheet.Item
                            onPress={async () => {
                              const placeIds = currentRoute.placeIds.includes(place.id)
                                ? currentRoute.placeIds.filter((id) => id !== place.id)
                                : [...currentRoute.placeIds, place.id]
                              await update({ routeId: currentRoute.id, placeIds })
                            }}
                          >
                            {currentRoute.placeIds.includes(place.id) ? '경로에서 제거' : '경로에 추가'}
                          </ActionSheet.Item>
                        )}
                      </ActionSheet>
                    ))
                  }}
                />
              )
            })}
          </Map>
        </Box>

        <BottomSheet
          snapPoints={BOTTOM_SHEET_RATIOS}
          defaultSnapIndex={BOTTOM_SHEET_RATIOS.indexOf(DEFAULT_BOTTOM_SHEET_RATIO)}
          onSnapChange={(ratio) => {
            // 1.0 은 지도를 0 으로 만든다. 그때는 자리를 건드리지 않는다.
            if (ratio < 1 && ratio !== sheetRatio) {
              setSheetRatio(ratio)
              setTimeout(() => mapRef.current?.relayout(), 350)
            }
          }}
        >
          <BottomSheet.Body>
            {/* 여행 일자 선택 — 바텀시트 상단에 고정하고, 아래 목록만 스크롤한다 */}
            {tripDates.length > 1 && (
              <Tabs
                value={selectedDate}
                onChange={(_, date) => {
                  setSelectedDate(date)
                  setRouteId('')
                }}
                scrollable
              >
                {tripDates.map((date) => (
                  <Tab key={date} value={date} label={formatShortDate(date)} />
                ))}
              </Tabs>
            )}
            <BottomSheet.GestureArea style={styles.sheetContent}>
              <Box style={[styles.sheetContent, styles.placeList]}>
                <SortableList
                  key={currentRoute?.id ?? 'empty'}
                  items={currentPlaces}
                  paddingHorizontal={16}
                  paddingBottom={40 + FLOATING_TAB_BAR_RESERVE}
                  ref={listRef}
                  onSort={(changed) => {
                    if (currentRoute == null) return
                    update({
                      routeId: currentRoute.id,
                      placeIds: changed.items.map((x) => x.id),
                    })
                  }}
                  renderItem={(place, idx) => {
                    if (currentRoute == null) return null
                    const inboundLeg = legByArrivalPlaceId[place.id]

                    return (
                      <Fragment key={place.id}>
                        <SortableList.Item id={place.id}>
                          {(inboundLeg != null && inboundLeg.duration > 0)
                            ? <RouteLegItem leg={inboundLeg} />
                            : <Box height={16} />
                          }
                          <TripRoutePlaceListItem
                            data={place}
                            tripId={tripId}
                            routeId={currentRoute.id}
                            focused={focusedId === place.id}
                            onPress={() => {
                              setFocusedId(place.id)
                              mapRef.current?.panTo(place.lat, place.lng, { paddingTop: headerInset })
                            }}
                            leftAddon={(
                              <SortableItem.Handle id={place.id}>
                                <MaterialIcons name="drag-indicator" size={24} color="#787c7e" />
                              </SortableItem.Handle>
                            )}
                            rightAddon={
                              <TripRoutePlaceListItem.Actions
                                tripId={tripId}
                                date={selectedDate}
                                routeId={currentRoute.id}
                                placeId={place.id}
                              />
                            }
                            titleIcon={<Dot>{idx + 1}</Dot>}
                          />
                        </SortableList.Item>
                      </Fragment>
                    )
                  }}
                />
              </Box>
            </BottomSheet.GestureArea>
          </BottomSheet.Body>
        </BottomSheet>
        {/**
         * @NOTE
         * 공간이 모자랄 때 조건부 렌더링이나 display: 'none' 으로 숨기면, 
         * 메뉴의 유리(GlassView) 항목이 투명하게 그려진다. 
         *  - 추론(미검증): 네이티브 뷰가 화면에서 떼였다 붙으면 Liquid Glass 가 배경 샘플링을 다시 잡지 못하는걸로 추측
         *  - 임시 조치 : 언마운트하지 않고 바텀시트(zIndex 가 더 높다) 뒤로 내려 숨긴다.
         * */}
        <MenuFab onPress={addPlaces} style={{ bottom: canShowRouteMenu ? `${sheetRatio * 100}%` : 0 }}>
          <MenuFab.Item
            icon={<MaterialIcons name="add-location-alt" size={18} color={palette.primary} />}
            onPress={addPlaces}
          >
            장소 추가
          </MenuFab.Item>
          <MenuFab.Item
            icon={<MaterialIcons name="route" size={18} color={palette.primary} />}
            onPress={() => setIsRouteToolbarOpen(true)}
          >
            경로 추가
          </MenuFab.Item>
        </MenuFab>
      </Box>
    </>
  )
}


function Dot({ children }: { children?: string | number }) {
  return (
    <View style={styles.dot}>
      <Typography style={styles.placeOrderLabel}>{children}</Typography>
    </View>
  )
}
const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  mapControl: { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  topOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 8 },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0 },
  sheetContent: { flex: 1, minHeight: 1 },
  routeHeader: { marginTop: 8 },
  emptyMessage: { paddingVertical: 24 },
  placeTitle: { flex: 1, minWidth: 0 },
  placeOrderLabel: { color: '#fff', fontSize: 11, fontWeight: '900' },
  placeList: { marginTop: 12 },
  pendingSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, height: `${DEFAULT_BOTTOM_SHEET_RATIO * 100}%`, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingTop: 24, backgroundColor: palette.background },
  dot: {
    width: 20,
    height: 20,
    minWidth: 20,
    minHeight: 20,
    borderRadius: 10,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    overflow: 'hidden',
  }
})
