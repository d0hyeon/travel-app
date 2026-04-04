import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Dialog, IconButton, Slide, Stack } from "@mui/material";
import { forwardRef, useRef, useState, type ComponentProps } from "react";
import { Mousewheel } from 'swiper/modules';
import { Swiper, SwiperSlide, type SwiperRef } from "swiper/react";
import type { Photo } from "~app/photo/photo.types";
import { useConfirmDialog } from "../../components/confirm-dialog/useConfirmDialog";

// @ts-ignore
import 'swiper/css';
import { ZoomArea } from "../ZoomArea";
import type { TransitionProps } from '@mui/material/transitions';

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

  const swiperRef = useRef<SwiperRef>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleZoomStart = () => {
    setIsZoomed(true);
    swiperRef.current?.swiper.disable()
  }
  const handleZoomEnd = async () => {
    setIsZoomed(false)
    await waitForTouchEnd();
    swiperRef.current?.swiper.enable();
  }

  return (
    <Dialog
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { bgcolor: 'black', maxHeight: '90vh' },

      }}
      slots={{ transition: Transition }}
      onClose={onClose}

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
          sx={{ cursor: isZoomed ? 'move' : 'pointer' }}
        >
          <Swiper
            slidesPerView={1}
            loop
            initialSlide={initialIndex}
            onSlideChange={({ realIndex }) => setIndex(realIndex)}
            modules={[Mousewheel]}
            mousewheel={{ enabled: !isZoomed, forceToAxis: true }}
            ref={swiperRef}
          >
            {photos.map((item, index) => (
              <SwiperSlide
                key={index}
                className="justify-normal items-center overflow-hidden "
                style={{ display: 'flex', justifyContent: 'center' }}
              >
                <ZoomArea
                  wheel={isZoomed ? 'zoom' : false}
                  onZoomStart={handleZoomStart}
                  onZoomEnd={handleZoomEnd}
                >

                  <Box component="img" src={item.url} maxWidth="100%" maxHeight="calc(90vh - 100px)" sx={{ objectFit: 'contain' }} />
                </ZoomArea>
              </SwiperSlide>
            ))}
          </Swiper>

        </Box>
      </Stack>
    </Dialog>
  )
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function waitForTouchEnd() {
  return new Promise<void>((resolve) => {

    window.addEventListener('', () => {
      console.log('?? ');
      resolve();
    }, { once: true })
  })
}