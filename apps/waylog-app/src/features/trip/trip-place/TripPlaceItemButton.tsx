import { MaterialIcons } from '@expo/vector-icons';
import { Box, Stack } from "../../../shared/components/mui";
import { Chip } from "../../../shared/components/mui/Chip";
import { type ComponentProps } from "react";
import { PlaceCategoryColorCode, type TripPlace } from '@waylog/domains/place';
import { ListItem } from "../../../shared/components/ListItem";
import { PopMenu } from "../../../shared/components/PopMenu";
import { useConfirmDialog } from "../../../shared/components/confirm-dialog/useConfirmDialog";
import { useTripPlaces } from '@waylog/domains/trip';

interface ItemProps extends ComponentProps<typeof ListItem.Button> {
  place: TripPlace;
}
export function TripPlaceItemButton({ place, ...props }: ItemProps) {
  const confirm = useConfirmDialog();
  const { remove } = useTripPlaces(place.tripId);

  return (
    <ListItem.Button
      key={place.id}
      rightAddon={(
        <PlaceItemMenu
          onEdit={() => {
            // TODO: 장소 수정 폼 오버레이 (trip-place-form)
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
              borderRadius: 6,
              backgroundColor: PlaceCategoryColorCode[place.category],
            }}
          />
        )}
        <ListItem.Title>{place.name}</ListItem.Title>
      </Stack>
      {place.address && (
        <ListItem.Text variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
          {place.address}
        </ListItem.Text>
      )}
      {!!place.memo && (
        <ListItem.Text variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
          {place.memo}
        </ListItem.Text>
      )}
      {place.tags.length > 0 && (
        <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap', mt: 0.5 }}>
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
          <PopMenu.Item onClick={onEdit} icon={<MaterialIcons name="edit" size={18} />}>
            수정
          </PopMenu.Item>
          <PopMenu.Item onClick={onDelete} icon={<MaterialIcons name="delete" size={18} color="#d32f2f" />} color="error">
            삭제
          </PopMenu.Item>
        </>
      }
    />
  )
}
