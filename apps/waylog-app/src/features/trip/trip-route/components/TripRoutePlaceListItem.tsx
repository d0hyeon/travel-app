import { StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons';
import { Box, Stack } from '~shared/components/design-system';
import { useMemo, type ReactNode } from 'react';
import type { TripPlace } from '@waylog/domains/modules/place';
import { ListItem } from '~shared/components/ListItem';
import { PopMenu } from '~shared/components/PopMenu';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { useDayTripRoutes, useTripRoutes } from '@waylog/domains/modules/trip';
import { useTripPlaceFormOverlay } from '~features/trip/trip-place/trip-place-form/useTripPlaceFormOverlay';
import { assert } from '~shared/utils/assert';
import { NoteEditor } from './RouteNoteList';

type ListItemButtonProps = Parameters<typeof ListItem.Button>[0];

interface TripRoutePlaceListItemProps extends ListItemButtonProps {
  tripId: string;
  routeId: string,
  title?: ReactNode;
  titleIcon?: ReactNode;
  data: TripPlace;
}

export function TripRoutePlaceListItem({ tripId, routeId, title, titleIcon, data: place, children, ...listItemProps }: TripRoutePlaceListItemProps) {
  const { data: { routes }, toggleVisible, update } = useTripRoutes(tripId);
  const currentRoute = useMemo(() => routes.find(route => route.id === routeId), [routeId, routes]);
  assert(currentRoute != null, `존재하지 않는 routeId입니다.`);

  const isHidden = useMemo(() => {
    return currentRoute.hiddenPlaces.includes(place.id);
  }, [currentRoute, place.id]);

  const routePlaceMemo = currentRoute.placeMemos[place.id];

  const updateMemos = (memos: string[]) => {
    update({
      routeId,
      placeMemos: {
        ...currentRoute.placeMemos,
        [place.id]: memos
      }
    })
  }


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
        <NoteEditor
          notes={routePlaceMemo ?? []}
          onChange={(memos) => updateMemos(memos)}
        />
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
  const { openBottomSheet: openPlaceEditor } = useTripPlaceFormOverlay();
  const { data: { routes }, update } = useDayTripRoutes({ tripId, date });

  const route = routes.find(x => x.id === routeId);
  const place = route?.places.find(x => x.id === placeId);
  if (!route || !place) return null;

  const editPlace = () => openPlaceEditor({ tripId, placeId: place.id });

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
})
