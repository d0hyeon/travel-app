import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import type { TripPlace } from '~features/place/place.types';
import { ListItem } from '~shared/components/ListItem';
import { PopMenu } from '~shared/components/PopMenu';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { useTripPlaces } from '../../trip-place/useTripPlaces';
import { useDayTripRoutes } from '../useDayTripRoutes';
import { usePlaceFormOverlay } from '../usePlaceFormOverlay';

type ListItemButtonProps = Parameters<typeof ListItem.Button>[0];

interface TripRoutePlaceListItemProps extends ListItemButtonProps {
  title?: ReactNode;
  data: TripPlace;
}

export function TripRoutePlaceListItem({ title, data: place, children, ...listItemProps }: TripRoutePlaceListItemProps) {

  return (
    <ListItem.Button sx={{ scrollMarginTop: 50 }} {...listItemProps}>
      {title ?? <ListItem.Title>{place.name}</ListItem.Title>}
      <Box>
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
  const { openBottomsheet: getUpdatedPlace } = usePlaceFormOverlay();
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
    <PopMenu
      items={(
        <>
          <PopMenu.Item onClick={editPlace} icon={<EditIcon fontSize="small" sx={{ mr: 1 }} />}>
            수정
          </PopMenu.Item>
          <PopMenu.Item onClick={removeFromRoute} icon={<DeleteIcon fontSize="small" sx={{ mr: 1 }} />} sx={{ color: 'error.main' }}>
            삭제
          </PopMenu.Item>
        </>
      )}
    />
  );
};
