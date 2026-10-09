import { StyleSheet } from 'react-native'
import { EMPTY_ROUTE_PLACE_TIME, formatRoutePlaceTime } from '@waylog/domains/modules/route';
import { MaterialIcons } from '@expo/vector-icons';
import { Box, Stack, Typography } from '~shared/components/design-system';
import { useMemo, type ReactNode } from 'react';
import type { TripPlace } from '@waylog/domains/modules/place';
import { ListItem } from '~shared/components/ListItem';
import { PopMenu } from '~shared/components/PopMenu';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { useDayTripRoutes, useTripRoutes } from '@waylog/domains/modules/trip';
import { useRoutePlaceEditOverlay } from '../trip-route-place/useRoutePlaceEditOverlay';
import { palette } from '~shared/config/tokens';
import { assert } from '~shared/utils/assert';

type ListItemButtonProps = Parameters<typeof ListItem.Button>[0];

interface TripRoutePlaceListItemProps extends ListItemButtonProps {
  tripId: string;
  routeId: string,
  title?: ReactNode;
  titleIcon?: ReactNode;
  data: TripPlace;
}

export function TripRoutePlaceListItem({ tripId, routeId, title, titleIcon, data: place, children, ...listItemProps }: TripRoutePlaceListItemProps) {
  const { data: { routes }, toggleVisible } = useTripRoutes(tripId);
  const currentRoute = useMemo(() => routes.find(route => route.id === routeId), [routeId, routes]);
  assert(currentRoute != null, `존재하지 않는 routeId입니다.`);

  const isHidden = useMemo(() => {
    return currentRoute.hiddenPlaces.includes(place.id);
  }, [currentRoute, place.id]);

  const timeLabel = formatRoutePlaceTime(currentRoute.placeTimes[place.id] ?? EMPTY_ROUTE_PLACE_TIME);
  const routeNotes = currentRoute.placeMemos[place.id] ?? [];

  return (
    <ListItem.Button
      {...listItemProps}
    >
      <Stack direction="row" alignItems="center" gap={0.5} style={styles.placeTitle}>
        {titleIcon}
        <ListItem.Title>{place.name}</ListItem.Title>
        <MaterialIcons
          name="visibility"
          size={18}
          color={isHidden ? '#bbb' : '#787c7e'}
          onPress={() => toggleVisible({ routeId, placeId: place.id })}
        />
        {timeLabel != null && (
          <Typography variant="body2" style={styles.timeLabel}>{timeLabel}</Typography>
        )}
      </Stack>
      <Box>
        {!!place.address && (
          <ListItem.Text variant="body2" color="text.secondary" style={styles.tripRoutePlaceListItemText}>
            {place.address}
          </ListItem.Text>
        )}
        {!!place.memo && (
          <ListItem.Text variant="body2" color="text.secondary" style={styles.tripRoutePlaceListItemText}>
            {place.memo}
          </ListItem.Text>
        )}
        {routeNotes.length > 0 && (
          <Stack direction="row" alignItems="flex-start" gap={0.75} style={styles.routeNotes}>
            <MaterialIcons name="directions-car" size={14} color={palette.primary} />
            <Typography variant="body2" style={styles.routeNoteText}>{routeNotes.join('\n')}</Typography>
          </Stack>
        )}
      </Box>
    </ListItem.Button>
  );
}

interface ActionsProps {
  tripId: string;
  date: string;
  routeId: string;
  placeId: string;
}

// 장소 수정/삭제 액션 메뉴. route 조회·변경은 내부 책임이다.
TripRoutePlaceListItem.Actions = function TripRoutePlaceListItemActions({ tripId, date, routeId, placeId }: ActionsProps) {
  const confirm = useConfirmDialog();
  const { open: openPlaceEditor } = useRoutePlaceEditOverlay();
  const { data: { routes }, update } = useDayTripRoutes({ tripId, date });

  const route = routes.find(x => x.id === routeId);
  const place = route?.places.find(x => x.id === placeId);
  if (!route || !place) return null;

  const editPlace = () => openPlaceEditor({ tripId, routeId, placeId: place.id });

  const removeFromRoute = async () => {
    if (!(await confirm('정말로 삭제하시겠어요?'))) return;
    update({ routeId, placeIds: route.placeIds.filter(id => id !== place.id) });
  };

  return (
    <PopMenu
      items={(
        <>
          <PopMenu.Item onPress={editPlace} icon={<MaterialIcons name="edit" size={18} />}>
            수정
          </PopMenu.Item>
          <PopMenu.Item onPress={removeFromRoute} icon={<MaterialIcons name="delete" size={18} color="#d32f2f" />} color="error">
            삭제
          </PopMenu.Item>
        </>
      )}
    />
  );
};

const styles = StyleSheet.create({
  tripRoutePlaceListItemText: { fontSize: 12 },
  placeTitle: { flex: 1, minWidth: 0 },
  timeLabel: { marginLeft: 'auto', fontSize: 12, fontWeight: '700', color: palette.primary },
  routeNotes: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: palette.divider,
  },
  routeNoteText: { flex: 1, fontSize: 12, color: palette.primary },
})
