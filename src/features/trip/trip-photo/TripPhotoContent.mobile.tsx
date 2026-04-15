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

  const filteredPhotos = selectedPlaceIds.length > 0
    ? selectedPlaceIds.map(x => photosByPlace[x]).flat() ?? []
    : photos;

  const placeLength = Object.keys(photosByPlace).length;

  const confirm = useConfirmDialog();
  const overlay = useOverlay();


  return (
    <>
      <Stack flex={1} p={2} pt={1} paddingBottom={isReadonly ? 2 : `calc(env(safe-area-inset-bottom) + ${BottomNavigation.HEIGHT + 16}px)`}>
        <Stack position="sticky" top={8} direction="row" alignItems="center" justifyContent={placeLength ? "space-between" : "end"} gap={1} mb={1} flexWrap="wrap" zIndex={10}>
          {placeLength > 0 && (
            <MultiSelectDropdown
              placeholder="장소"
              options={places
                .filter(x => isNotEmpty(photosByPlace[x.id]))
                .map(x => ({ label: x.name, value: x.id }))
              }
              value={selectedPlaceIds}
              onChange={setSelectedPlaceIds}
              sx={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(5px)' }}
            />
          )}
          <IOSChipButton sx={!isReadonly ? { transform: 'scale(1.15)' } : {}} onClick={() => setIsReadonly(curr => !curr)}>
            {isReadonly ? '선택' : '완료'}
          </IOSChipButton>
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
                    <Box position="absolute" display="flex" justifyContent="end" alignItems="end" right={0} top={0} padding={1} borderRadius={3} zIndex={5} width="100%" height="100%" sx={isSelected ? { backgroundColor: 'rgba(0, 0, 0, 0.4)' } : {}}>
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

function isNotEmpty<T>(value?: T[]) {
  return !!value?.length;
}


const IOSChipButton = styled(Button)(({ size = 'medium' }) => ({
  borderRadius: '24px !important',
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  boxShadow: "0px 3px 8px rgba(255, 255, 255, 0.3) !important",
  color: 'white',
  backdropFilter: 'blur(3px)',
  transition: 'all 300ms',
  border: `1px solid ${alpha('#fff', 0.5)}`,
  paddingInline: size === 'medium' ? '12px !important' : undefined,
  fontSize: size === 'medium' ? '13px !important' : undefined,
  '&::before': {
    content: '""',
    position: 'absolute', top: 0, left: 0,
    width: '100%', height: '100%',
    zIndex: '5',
    transition: 'all 200ms'
  },
  '&:active::before': {
    backdropFilter: 'blur(2px)',
  }
}))