import CheckIcon from '@mui/icons-material/TaskAlt';
import { alpha, Box, Button, ImageList, Stack, styled } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { BottomArea } from '~shared/components/BottomArea';
import { BottomNavigation } from '~shared/components/BottomNavigation';
import { MultiSelectDropdown } from '~shared/components/MultiSelectDropdown';
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog';
import { PhotoBottomSheet } from '~shared/components/photo/PhotoBottomSheet';
import { PhotoUploader } from '~shared/components/photo/PhotoUploader';
import { useOverlay } from '~shared/hooks/useOverlay';
import { PhotoThunbnail } from '../../../shared/components/photo/PhotoThumbnail';
import type { Photo } from '../../photo/photo.types';
import { useTripPlaces } from '../trip-place/useTripPlaces';
import { useTripPhotos } from './useTripPhotos';
interface TripPhotoContentProps {
  tripId: string
}

export function preload(tripId: string) {
  useTripPhotos.prefetch(tripId);
}

export default function TripPhotoContent({ tripId }: TripPhotoContentProps) {
  const { data: photos, upload, remove } = useTripPhotos(tripId)

  const { data: places } = useTripPlaces(tripId);
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isReadonly, setIsReadonly] = useState(true)

  useEffect(() => {
    if (isReadonly) setSelectedPhotoIds([]);
  }, [isReadonly])

  const photosByPlace = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    photos.forEach(photo => {
      if (photo.placeId == null) return;
      if (!grouped[photo.placeId]) {
        grouped[photo.placeId] = [];
      }
      grouped[photo.placeId].push(photo);
    });
    return grouped;
  }, [photos]);

  const placesWithPhotos = useMemo(() => {
    return places.filter(place => photosByPlace[place.id]?.length > 0);
  }, [places, photosByPlace]);

  const filteredPhotos = selectedPlaceIds.length > 0
    ? selectedPlaceIds.map(x => photosByPlace[x]).flat() ?? []
    : photos;

  const hasPhotoWithPlace = Object.keys(photosByPlace).length > 0;

  const confirm = useConfirmDialog();
  const overlay = useOverlay();


  return (
    <>
      <Stack flex={1} p={2} pt={1} paddingBottom={isReadonly ? 2 : `calc(env(safe-area-inset-bottom) + ${BottomNavigation.HEIGHT + 16}px)`}>
        <Stack position="sticky" top={8} direction="row" alignItems="center" justifyContent={hasPhotoWithPlace ? "space-between" : "end"} gap={1} mb={1} flexWrap="wrap" zIndex={10}>
          {hasPhotoWithPlace && (
            <MultiSelectDropdown
              placeholder="장소"
              options={placesWithPhotos.map(x => ({ label: x.name, value: x.id }))}
              value={selectedPlaceIds}
              onChange={setSelectedPlaceIds}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(5px)' }}
            />
          )}
          <IOSToggleButton actived={!isReadonly} onClick={() => setIsReadonly(curr => !curr)}>
            {isReadonly ? '선택' : '완료'}
          </IOSToggleButton>
        </Stack>
        <Box>
          <ImageList cols={3}>
            <PhotoUploader
              width="100%"
              onUpload={(files) => upload({ files })}
              multiple
            />
            {filteredPhotos.map((x, i) => {
              const isSelected = selectedPhotoIds.includes(x.id);

              return (
                <Box
                  key={x.id}
                  position="relative"
                  onClick={() => {
                    if (isReadonly) {
                      return overlay.open(({ isOpen, close }) => (
                        <PhotoBottomSheet
                          isOpen={isOpen}
                          onClose={close}
                          photos={photos}
                          onDelete={remove}
                          initialIndex={i}
                        />
                      ));
                    }

                    setSelectedPhotoIds(ids => isSelected
                      ? ids.filter(id => id !== x.id)
                      : [...ids, x.id]
                    )
                  }}
                >
                  {!isReadonly && (
                    <Box position="absolute" display="flex" justifyContent="end" alignItems="end" right={0} top={0} padding={1} zIndex={5} width="100%" height="100%" sx={isSelected ? { backdropFilter: 'blur(1px)', backgroundColor: 'rgba(0, 0, 0, 0.1)' } : {}}>
                      {isSelected && <CheckIcon color="primary" sx={{ fill: '#fff', color: '#fff' }} />}
                    </Box>
                  )}
                  <PhotoThunbnail key={x.id} src={x.url} />
                </Box>
              )
            })}
          </ImageList>
        </Box>
      </Stack>
      {!isReadonly && (
        <BottomArea position="fixed" zIndex={10} bottom={BottomNavigation.HEIGHT}>
          <Button
            color="error"
            variant="contained"
            onClick={async () => {
              if (await confirm('정말 삭제하시겠어요?')) {
                await Promise.all(
                  selectedPhotoIds.map((selectedId) => (
                    remove(photos.find(photo => photo.id === selectedId)!)
                  ))
                )
              }
            }}
            fullWidth
          >
            삭제 ({selectedPhotoIds.length}/{filteredPhotos.length})
          </Button>
        </BottomArea>
      )}
    </>
  );
}


const IOSToggleButton = styled(Button)<{ actived: boolean }>(({ actived, theme, size = 'medium' }) => ({
  borderRadius: '24px !important',
  backgroundColor: actived ? alpha(theme.palette.primary.main, 1) : alpha(theme.palette.background.default, 0.5),
  border: actived ? undefined : `1px solid ${theme.palette.primary.main}`,
  transform: actived ? "scale(1.1)" : undefined,
  boxShadow: actived ? '0px 3px 6px rgba(0, 0, 0, 0.4) !important' : undefined,
  color: actived ? 'white' : theme.palette.primary.main,
  backdropFilter: 'blur(5px)',
  transition: 'all 300ms',
  paddingInline: size === 'medium' ? '12px !important' : undefined,
  fontSize: size === 'medium' ? '13px !important' : undefined
}))