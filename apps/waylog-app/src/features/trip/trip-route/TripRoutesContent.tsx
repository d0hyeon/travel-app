import { StyleSheet } from 'react-native'
import { findNearestPlace } from '@waylog/domains/modules/trip'
import { formatDisplayDate, formatShortDate } from '@waylog/utility'
import { useDayTripRoutes, useTrip, useTripPlaces } from '@waylog/domains/modules/trip'
import { PlaceCategoryColorCode } from '@waylog/domains/modules/place'
import { MaterialIcons } from '@expo/vector-icons'
import { Fragment, Suspense, useMemo, useRef, useState } from 'react'
import { Box, IconButton, MenuFab, Stack, Tab, Tabs, Typography } from '~/shared/components/design-system'
import { BottomSheet } from '../../../shared/components/bottom-sheet/BottomSheet'
import { ListItem } from '../../../shared/components/ListItem'
import { SortableItem, SortableList, type SortableListRef } from '../../../shared/components/dnd/SortableList'
import { Map, type MapRef } from '../../../shared/components/Map'
import { useCurrentCoordinate } from '../../../shared/hooks/env/useCurrentCoordinate'
import { useOverlay } from '../../../shared/hooks/useOverlay'
import { useQueryParamState } from '../../../shared/hooks/useQueryParamState'
import { palette } from '../../../shared/config/tokens'
import { useRouteLegsPathList } from '../hooks/useRouteLegsPathList'
import { TripRouteMapFloatingControls } from './components/TripRouteMapFloatingControls'
import { PlaceSelectSheet } from './PlaceSelectSheet'
import { NoteEditor } from './RouteNoteList'
import { TripRoutePlaceListItem } from './components/TripRoutePlaceListItem'
import { Dot, RouteLegItem } from './RouteTimeline'
import { useRouteLegs } from './useRouteLegs'
import { useTripPlaceFormOverlay } from '../trip-place/trip-place-form/useTripPlaceFormOverlay'
import { FloatingControl } from '../components/FloatingControl'
import { useActiveTripDay } from './useActiveTripDay'
import { TripMarineActivityMapMarkers } from '../trip-marine-activity/TripMarineActivityMapMarkers'
import { TripWeatherIconButton } from '../trip-weather/TripWeatherIconButton'
import { ActionSheet } from '../../../shared/components/action-sheet/ActionSheet'
import { useTripViewConfigValue } from './useTripViewConfig'
import { getRouteColor } from '../trip-expense/routeExpenseView.utils'
import { TripRouteConfigToolbar } from './TripRouteConfigToolbar'
import { getItemOffsetY, ITEM_HEIGHT } from '~/shared/components/design-system/menu-fab/menuFabMotion'
import { FLOATING_TAB_BAR_RESERVE } from '../../../shared/components'

const BOTTOM_SHEET_RATIOS = [0.25, 0.5, 0.65, 0.8, 1] as const
const DEFAULT_BOTTOM_SHEET_RATIO = 0.65 satisfies (typeof BOTTOM_SHEET_RATIOS)[number]
const MIN_MAP_MENU_HEIGHT = getItemOffsetY(1) + ITEM_HEIGHT + 32

interface RouteContentProps {
  tripId: string
}

export default function TripRoutesContent({ tripId }: RouteContentProps) {
  const { data: trip } = useTrip(tripId)
  const { data: allPlaces } = useTripPlaces(tripId)

  // 웹과 같은 훅을 쓴다. 기본값 계산은 공유 getDefaultTripDay 가 한다.
  const { value: selectedDate, update: setSelectedDate } = useActiveTripDay(tripId)

  const {
    data: { routes, tripDates },
    update,
    toggleVisible,
    updateNotes,
  } = useDayTripRoutes({ tripId, date: selectedDate })

  const [selectedRouteId, setSelectedRouteId] = useQueryParamState<string>('route-id', {
    defaultValue: () => routes[0]?.id ?? '',
  })

  const currentRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) ?? routes[0],
    [routes, selectedRouteId],
  )

  // 숨긴 장소는 경로 계산에서 뺀다.
  const visiblePlaces = useMemo(
    () => currentRoute?.places.filter((x) => !currentRoute.hiddenPlaces.includes(x.id)) ?? [],
    [currentRoute],
  )
  const legByArrivalPlaceId = useRouteLegs(visiblePlaces)

  // 같은 날짜의 모든 route를 지도에 함께 그린다 (웹과 동일).
  const visiblePlacesByRoute = useMemo(
    () => routes.map((route) => route.places.filter((x) => !route.hiddenPlaces.includes(x.id))),
    [routes],
  )
  const legsByRoute = useRouteLegsPathList(visiblePlacesByRoute)

  const currentPlaces = currentRoute?.places ?? []

  const viewConfig = useTripViewConfigValue()
  const mapRef = useRef<MapRef>(null)
  const overlay = useOverlay()
  const { openBottomSheet: openPlaceEditor } = useTripPlaceFormOverlay()

  // 여행 중이면 현재 위치로 이동하고 가장 가까운 장소를 잡아준다.
  const today = formatDisplayDate(new Date())
  const isOngoingTrip = trip.startDate <= today && today <= trip.endDate
  const isInitialedRef = useRef(false)

  const currentCoordinate = useCurrentCoordinate({
    enabled: isOngoingTrip,
    onChange: (coordinate) => {
      if (isInitialedRef.current) return
      isInitialedRef.current = true

      mapRef.current?.panTo(coordinate.lat, coordinate.lng)

      if (selectedDate === today) {
        const nearestPlace = findNearestPlace(coordinate, currentRoute?.places ?? [])
        if (nearestPlace != null) focusPlace(nearestPlace.id)
      }
    },
  })
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const listRef = useRef<SortableListRef>(null)

  // 포커스와 목록 스크롤을 함께 옮긴다. 지도에서 장소를 고를 때 쓴다.
  const focusPlace = (placeId: string) => {
    setFocusedId(placeId)
    listRef.current?.scrollToItem(placeId)
  }
  const [sheetRatio, setSheetRatio] = useState(DEFAULT_BOTTOM_SHEET_RATIO)
  const [containerHeight, setContainerHeight] = useState(0)
  const [isRouteToolbarOpen, setIsRouteToolbarOpen] = useState(false)
  const canShowRouteMenu = containerHeight * (1 - sheetRatio) >= MIN_MAP_MENU_HEIGHT


  const addPlaces = () => {
    if (currentRoute == null) {
      setIsRouteToolbarOpen(true)
      return
    }

    overlay.open(({ isOpen, close }) => (
      <PlaceSelectSheet
        isOpen={isOpen}
        onClose={close}
        tripId={tripId}
        selectedPlaceIds={currentRoute.placeIds}
        onConfirm={(placeIds) => {
          if (placeIds.length === 0) return
          const merged = Array.from(new Set([...currentRoute.placeIds, ...placeIds]))
          update({ routeId: currentRoute.id, placeIds: merged })
        }}
      />
    ))
  }

  return (
    <>
      <Box style={styles.container} onLayout={({ nativeEvent }) => setContainerHeight(nativeEvent.layout.height)}>
        {isRouteToolbarOpen && (
          <TripRouteConfigToolbar
            tripId={tripId}
            date={selectedDate}
            value={currentRoute.id}
            onSelect={setSelectedRouteId}
            onAdd={(route) => setSelectedRouteId(route.id)}
            onDelete={(id) => {
              if (currentRoute.id === id) {
                const index = routes.findIndex(x => x.id === id);
                setSelectedRouteId(routes[index - 1].id);
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
        <TripRouteMapFloatingControls />
        {currentCoordinate != null && (
          <FloatingControl corner="bottom-left" zIndex={8} style={{ bottom: `${sheetRatio * 100}%` }}>
            <IconButton
              size="small"
              onPress={() => mapRef.current?.panTo(currentCoordinate.lat, currentCoordinate.lng)}
              style={styles.mapControl}
            >
              <MaterialIcons name="my-location" size={20} color={palette.primary} />
            </IconButton>
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
            {[
              ...routes.flatMap((route, routeIndex) => {
                const isSelectedRoute = route.id === currentRoute?.id

                return (legsByRoute[routeIndex] ?? []).map((leg, legIndex) => (
                  <Map.Path
                    key={`route_${route.id}_leg_${legIndex}`}
                    coordinates={leg.coordinates}
                    strokeColor={getRouteColor(routeIndex)}
                    strokeWeight={isSelectedRoute ? 5 : 3}
                    strokeOpacity={isSelectedRoute ? 1 : 0.6}
                  />
                ))
              }),
              ...allPlaces.flatMap((place) => {
                const isInCurrentRoute = currentRoute?.placeIds.includes(place.id) ?? false
                const orderInRoute = currentRoute?.placeIds.indexOf(place.id) ?? -1

                if (!viewConfig.isVisibleAllMarkers && !isInCurrentRoute) return []

                return [
                  <Map.Marker
                    key={place.id}
                    lat={place.lat}
                    lng={place.lng}
                    label={isInCurrentRoute ? `${orderInRoute + 1}. ${place.name}` : place.name}
                    color={isInCurrentRoute && place.category ? PlaceCategoryColorCode[place.category] : 'disabled'}
                    onPress={() => {
                      if (isInCurrentRoute) {
                        focusPlace(place.id)
                        mapRef.current?.panTo(place.lat, place.lng)
                      }
                      overlay.open(({ isOpen, close }) => (
                        <ActionSheet isOpen={isOpen} onClose={close}>
                          <ActionSheet.Item
                            onPress={() => openPlaceEditor({ tripId, placeId: place.id })}
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
                  />,
                ]
              }),
            ]}
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
                  setSelectedRouteId('')
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

                    const inboundLeg = legByArrivalPlaceId.get(place.id)
                    const isHidden = currentRoute.hiddenPlaces.includes(place.id)

                    return (
                      <Fragment key={place.id}>
                        <SortableList.Item id={place.id}>
                          {inboundLeg != null && inboundLeg.duration > 0 && (
                            <RouteLegItem leg={inboundLeg} />
                          )}
                          <TripRoutePlaceListItem
                            data={place}
                            focused={focusedId === place.id}
                            onPress={() => {
                              setFocusedId(place.id)
                              mapRef.current?.panTo(place.lat, place.lng)
                            }}
                            leftAddon={(
                              <SortableItem.Handle id={place.id}>
                                <MaterialIcons name="drag-indicator" size={24} color="#787c7e" />
                              </SortableItem.Handle>
                            )}
                            title={
                              <Stack direction="row" alignItems="center" gap={0.5} style={styles.placeTitle}>
                                <Dot>
                                  <Typography style={styles.placeOrderLabel}>
                                    {idx + 1}
                                  </Typography>
                                </Dot>
                                <ListItem.Title>{place.name}</ListItem.Title>
                                <MaterialIcons
                                  name={isHidden ? 'visibility-off' : 'visibility'}
                                  size={18}
                                  color={isHidden ? '#bbb' : '#787c7e'}
                                  onPress={() => toggleVisible({ routeId: currentRoute.id, placeId: place.id })}
                                />
                              </Stack>
                            }
                            rightAddon={
                              <TripRoutePlaceListItem.Actions
                                tripId={tripId}
                                date={selectedDate}
                                routeId={currentRoute.id}
                                placeId={place.id}
                              />
                            }
                          >
                            <NoteEditor
                              notes={place.routeNotes ?? []}
                              onChange={(memos) =>
                                updateNotes({ placeId: place.id, routeId: currentRoute.id, memos })
                              }
                            />
                          </TripRoutePlaceListItem>
                        </SortableList.Item>
                      </Fragment>
                    )
                  }}
                />
              </Box>
            </BottomSheet.GestureArea>
          </BottomSheet.Body>
        </BottomSheet>
        {canShowRouteMenu && (
          <MenuFab onPress={addPlaces} style={{ bottom: `${sheetRatio * 100}%` }}>
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
        )}
      </Box>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', overflow: 'hidden' },
  mapControl: { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0 },
  sheetContent: { flex: 1, minHeight: 1 },
  routeHeader: { marginTop: 8 },
  emptyMessage: { paddingVertical: 24 },
  placeTitle: { flex: 1, minWidth: 0 },
  placeOrderLabel: { color: '#fff', fontSize: 11, fontWeight: '900' },
  placeList: { marginTop: 12 }
})
