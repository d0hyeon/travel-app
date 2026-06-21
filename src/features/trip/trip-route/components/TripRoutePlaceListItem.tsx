import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityOnIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, IconButton, Stack } from '@mui/material';
import { ListItem } from '~shared/components/ListItem';
import { PopMenu } from '~shared/components/PopMenu';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { useTripPlaces } from '../../trip-place/useTripPlaces';
import { NoteEditor } from '../RouteNoteList';
import { Dot } from '../RouteTimeline';
import { useDayTripRoutes } from '../useDayTripRoutes';
import { usePlaceFormOverlay } from '../usePlaceFormOverlay';

type ListItemButtonProps = Parameters<typeof ListItem.Button>[0];

interface TripRoutePlaceListItemProps extends ListItemButtonProps {
  tripId: string;
  date: string;
  routeId: string;
  placeId: string;
  order: number;
}

// 모바일 경로 내 한 장소의 행(터치형). 순서·이름·주소·메모·노트와 노출 토글을 보여준다.
// 정렬 핸들·클릭 등 외부 맥락은 ListItem.Button props로 주입받고, 수정/삭제는 Actions 컴파운드로 위임한다.
export function TripRoutePlaceListItem({ tripId, date, routeId, placeId, order, ...listItemProps }: TripRoutePlaceListItemProps) {
  const { data: { routes }, updateNotes, toggleVisible } = useDayTripRoutes({ tripId, date });

  const route = routes.find(x => x.id === routeId);
  const place = route?.places.find(x => x.id === placeId);
  if (!route || !place) return null;

  const isHidden = route.hiddenPlaces.includes(place.id);

  return (
    <ListItem.Button sx={{ scrollMarginTop: 50 }} {...listItemProps}>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Dot>{order}</Dot>
        <ListItem.Title>{place.name}</ListItem.Title>
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            toggleVisible({ routeId, placeId: place.id });
          }}
        >
          {isHidden ? <VisibilityOffIcon fontSize="small" sx={{ opacity: 0.7 }} /> : <VisibilityOnIcon fontSize="small" />}
        </IconButton>
      </Stack>
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
        <NoteEditor
          notes={place.routeNotes ?? []}
          onChange={(memos) => updateNotes({ placeId: place.id, routeId, memos })}
          action="dialog"
          marginTop={1}
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
