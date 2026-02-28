import { Box, Dialog, IconButton, Stack } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, type ComponentProps } from "react";
import type { Photo } from "~features/photo/photo.types";
import { Swiper, SwiperSlide } from "swiper/react";
import { useConfirmDialog } from "../../modules/confirm-dialog/useConfirmDialog";

// @ts-ignore
import 'swiper/css';

type Props = {
  photos: Photo[];
  onDelete?: (photo: Photo) => void;
  initialIndex?: number
  onClose: () => void;
} & Omit<ComponentProps<typeof Dialog>, 'onClose'>;

export function PhotoDialog({ photos: _photos, onDelete, initialIndex = 0, onClose, ...props }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [photos, setPhotos] = useState(_photos);
  const confirm = useConfirmDialog();

  const handleDelete = async () => {
    const photo = photos.at(index);
    if (photo != null) {
      if (await confirm('추억을 지우시겠어요?')) {
        if (photos.length === 1) {
          onClose();
        }

        setPhotos((photos) => photos.filter(x => x.id !== photo.id));
        onDelete?.(photo);
      }
    }
  }

  return (
    <Dialog
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'black', maxHeight: '90vh' }
      }}
      {...props}
    >
      <Stack height="100%">
        <Stack
          direction="row"
          justifyContent="space-between"
          p={1}
          position="absolute"
          top={0}
          left={0}
          right={0}
          zIndex={1}
        >
          {onDelete && (
            <IconButton onClick={handleDelete} sx={{ color: 'white' }}>
              <DeleteIcon />
            </IconButton>
          )}
          <IconButton
            onClick={onClose}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flex={1}
          p={2}
          pt={7}
        >
          <Swiper
            slidesPerView={1}
            loop
            initialSlide={initialIndex}
            onSlideChange={({ realIndex }) => setIndex(realIndex)}

          >
            {photos.map((item, index) => (
              <SwiperSlide
                key={index}
                className="justify-normal items-center overflow-hidden "
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <Box component="img" src={item.url} maxWidth="100%" maxHeight="calc(90vh - 100px)" sx={{ objectFit: 'contain' }} />
              </SwiperSlide>
            ))}
          </Swiper>

        </Box>
      </Stack>
    </Dialog>
  )
}