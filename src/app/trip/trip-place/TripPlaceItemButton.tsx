import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Chip, Stack } from "@mui/material";
import { type ComponentProps } from "react";
import { PlaceCategoryColorCode, type Place } from "~app/place/place.types";
import { ListItem } from "~shared/components/ListItem";
import { PopMenu } from "~shared/components/PopMenu";
import { useIsMobile } from "~shared/hooks/useIsMobile";
import { useConfirmDialog } from "~shared/modules/confirm-dialog/useConfirmDialog";
import { useTripPlaceDetailOverlay } from "./useTripPlaceDetailOverlay";
import { useTripPlaces } from "./useTripPlaces";

interface ItemProps extends ComponentProps<typeof ListItem.Button> {
  place: Place;
}
export function TripPlaceItemButton({ place, ...props }: ItemProps) {
  const confirm = useConfirmDialog();
  const { remove } = useTripPlaces(place.tripId);
  const {
    openDialog: openPlaceDetailDialog,
    openBottomSheet: openPlaceDetailSheet
  } = useTripPlaceDetailOverlay();

  const isMobile = useIsMobile();

  return (
    <ListItem.Button
      key={place.id}
      rightAddon={(
        <PlaceItemMenu
          onEdit={() => {
            if (isMobile) {
              return openPlaceDetailSheet({ placeId: place.id, tripId: place.tripId });
            }
            openPlaceDetailDialog({ placeId: place.id, tripId: place.tripId });
          }}
          onDelete={async () => {
            if (await confirm('삭제하시겠어요?')) {
              remove(place.id)
            }
          }}
        />
      )}
      {...props}
    >
      <Stack direction="row" gap={0.5} alignItems="center">
        {!!place.category && (
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: PlaceCategoryColorCode[place.category],
            }}
          />
        )}
        <ListItem.Title>{place.name}</ListItem.Title>
      </Stack>
      {place.address && (
        <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
          {place.address}
        </ListItem.Text>
      )}
      {!!place.memo && (
        <ListItem.Text variant="body2" color="text.secondary" fontSize={12}>
          {place.memo}
        </ListItem.Text>
      )}
      {place.tags.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
          {place.tags.map(x => (
            <Chip key={x} label={x} size="small" />
          ))}
        </Stack>
      )}
    </ListItem.Button>
  )
}

interface PlaceItemMenuProps {
  onEdit: () => void
  onDelete: () => void
}

function PlaceItemMenu({ onEdit, onDelete }: PlaceItemMenuProps) {
  return (
    <PopMenu
      items={
        <>
          <PopMenu.Item onClick={onEdit} icon={<EditIcon fontSize="small" sx={{ mr: 1 }} />}>
            수정
          </PopMenu.Item>
          <PopMenu.Item onClick={onDelete} icon={<DeleteIcon fontSize="small" sx={{ mr: 1 }} />} sx={{ color: 'error.main' }}>
            삭제
          </PopMenu.Item>
        </>
      }
    />
  )
}
