import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, IconButton } from '@mui/material';
import type { ReactNode } from 'react';
import type { TripPlace } from '~features/place/place.types';
import { ListItem } from '~shared/components/ListItem';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { useTripPlaces } from '../../trip-place/useTripPlaces';
import { useDayTripRoutes } from '../useDayTripRoutes';
import { usePlaceFormOverlay } from '../usePlaceFormOverlay';

type ListItemProps = Parameters<typeof ListItem>[0];

interface TripRoutePlaceItemProps extends ListItemProps {
  data: TripPlace;
  title?: ReactNode;
}

export function TripRoutePlaceItem({ data: place, title, children, ...listItemProps }: TripRoutePlaceItemProps) {


  return (
    <ListItem {...listItemProps}>
      {title ?? <ListItem.Title>{place.name}</ListItem.Title>}
      {place.address && (
        <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
          {place.address}
        </ListItem.Text>
      )}
      {place.memo && (
        <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
          {place.memo}
        </ListItem.Text>
      )}
      {children}
    </ListItem>
  );
}

interface ActionsProps {
  tripId: string;
  date: string;
  routeId: string;
  placeId: string;
}

// 장소 수정/삭제 액션. route 조회·변경은 내부 책임이다.
TripRoutePlaceItem.Actions = function TripRoutePlaceItemActions({ tripId, date, routeId, placeId }: ActionsProps) {
  const confirm = useConfirmDialog();
  const { openDialog: getUpdatedPlace } = usePlaceFormOverlay();
  const { update: updatePlace } = useTripPlaces(tripId);
  const { data: { routes }, update } = useDayTripRoutes({ tripId, date });

  const route = routes.find(x => x.id === routeId);
  const place = route?.places.find(x => x.id === placeId);
  if (!route || !place) return null;

  const editPlace = async () => {
    const updated = await getUpdatedPlace({ tripId, placeId: place.id, defaultValues: place });
    if (!updated) return;
    updatePlace({ ...updated, id: place.id, category: updated.category || undefined, tags: updated.tags });
  };

  const removeFromRoute = async () => {
    if (!(await confirm('정말로 삭제하시겠어요?'))) return;
    update({ routeId, placeIds: route.placeIds.filter(id => id !== place.id) });
  };

  return (
    <Box flexShrink={0}>
      <IconButton size="small" onClick={editPlace}>
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" color="error" onClick={removeFromRoute}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
