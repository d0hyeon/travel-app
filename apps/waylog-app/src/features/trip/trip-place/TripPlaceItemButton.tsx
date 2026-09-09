import { StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons';
import { Box, Stack } from "~/shared/components/design-system";
import { Chip } from "~/shared/components/design-system/Chip";
import { type ComponentProps } from "react";
import { PlaceCategoryColorCode, type TripPlace } from '@waylog/domains/modules/place';
import { ListItem } from "../../../shared/components/ListItem";
import { PopMenu } from "../../../shared/components/PopMenu";
import { useConfirmDialog } from "../../../shared/components/confirm-dialog/useConfirmDialog";
import { useTripPlaces } from '@waylog/domains/modules/trip';
import { useTripPlaceFormOverlay } from './trip-place-form/useTripPlaceFormOverlay';

interface ItemProps extends ComponentProps<typeof ListItem.Button> {
  place: TripPlace;
}
export function TripPlaceItemButton({ place, ...props }: ItemProps) {
  const confirm = useConfirmDialog();
  const { remove } = useTripPlaces(place.tripId);
  const { openBottomSheet: openPlaceForm } = useTripPlaceFormOverlay();

  return (
    <ListItem.Button
      key={place.id}
      rightAddon={(
        <PlaceItemMenu
          onEdit={() => {
            void openPlaceForm({
              tripId: place.tripId,
              placeId: place.id,
            });
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
            style={[styles.categoryDot, { backgroundColor: PlaceCategoryColorCode[place.category] }]}
          />
        )}
        <ListItem.Title>{place.name}</ListItem.Title>
      </Stack>
      {!!place.address && (
        <ListItem.Text variant="body2" color="text.secondary" style={styles.description}>
          {place.address}
        </ListItem.Text>
      )}
      {!!place.memo && (
        <ListItem.Text variant="body2" color="text.secondary" style={styles.description}>
          {place.memo}
        </ListItem.Text>
      )}
      {place.tags.length > 0 && (
        <Stack direction="row" gap={0.5} style={styles.tags}>
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
          <PopMenu.Item onPress={onEdit} icon={<MaterialIcons name="edit" size={18} />}>
            수정
          </PopMenu.Item>
          <PopMenu.Item onPress={onDelete} icon={<MaterialIcons name="delete" size={18} color="#d32f2f" />} color="error">
            삭제
          </PopMenu.Item>
        </>
      }
    />
  )
}

const styles = StyleSheet.create({
  categoryDot: { width: 12, height: 12, borderRadius: 6 },
  description: { fontSize: 12 },
  tags: { flexWrap: 'wrap', marginTop: 4 },
})
