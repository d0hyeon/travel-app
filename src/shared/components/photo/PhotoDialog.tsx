import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Downloading';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Dialog, IconButton, ListSubheader, Menu, MenuItem, Slide, Stack } from "@mui/material";
import { forwardRef, useRef, useState, type ComponentProps } from "react";
import { Mousewheel } from 'swiper/modules';
import { Swiper, SwiperSlide, type SwiperRef } from "swiper/react";
import type { Photo } from "~features/photo/photo.types";
import { useConfirmDialog } from "../../components/confirm-dialog/useConfirmDialog";

// @ts-ignore
import 'swiper/css';
import { ZoomArea } from "../ZoomArea";
import type { TransitionProps } from '@mui/material/transitions';

type Props = {
  photos: Photo[];
  onDelete?: (photo: Photo) => void;
  onUpdateVisibility?: (photo: Photo, isPublic: boolean) => Promise<unknown>;
  initialIndex?: number
  onClose: () => void;
} & Omit<ComponentProps<typeof Dialog>, 'onClose'>;


export function PhotoDialog({ photos: _photos, onDelete, onUpdateVisibility, initialIndex = 0, onClose, ...props }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [photos, setPhotos] = useState(_photos);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
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

  const handleChangeVisibility = async (isPublic: boolean) => {
    const photo = photos.at(index);
    if (!photo || photo.isPublic === isPublic) {
      setMenuAnchorEl(null);
      return;
    }

    setPhotos((current) => current.map((item) => (
      item.id === photo.id ? { ...item, isPublic } : item
    )));
    setMenuAnchorEl(null);
    await onUpdateVisibility?.(photo, isPublic);
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
          <Stack direction="row" spacing={1}>
            {onUpdateVisibility && (
              <>
                <IconButton onClick={(event) => setMenuAnchorEl(event.currentTarget)} sx={{ color: 'white' }}>
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={menuAnchorEl}
                  open={Boolean(menuAnchorEl)}
                  onClose={() => setMenuAnchorEl(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        minWidth: 160,
                      },
                    },
                  }}
                >
                  <MenuItem onClick={() => {
                    void downloadRemoteSource(photos[index].url);
                    setMenuAnchorEl(null);
                  }} sx={{ minHeight: 40 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                      <Box>다운로드</Box>
                      <DownloadIcon fontSize="small" />
                    </Stack>
                  </MenuItem>
                  <ListSubheader
                    disableSticky
                    sx={{
                      fontSize: 11,
                      lineHeight: 1.4,
                      color: 'text.secondary',
                      fontWeight: 700,
                      py: 0.75,
                      bgcolor: 'transparent',
                    }}
                  >
                    공개 설정
                  </ListSubheader>
                  <MenuItem onClick={() => void handleChangeVisibility(true)} sx={{ minHeight: 40 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                      <Box>공개</Box>
                      {photos[index]?.isPublic && <CheckIcon fontSize="small" />}
                    </Stack>
                  </MenuItem>
                  <MenuItem onClick={() => void handleChangeVisibility(false)} sx={{ minHeight: 40 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                      <Box>비공개</Box>
                      {!photos[index]?.isPublic && <CheckIcon fontSize="small" />}
                    </Stack>
                  </MenuItem>
                </Menu>
              </>
            )}
            <IconButton
              onClick={onClose}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
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

async function downloadRemoteSource(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  const [filename] = url.split('/').reverse();
  const file = new File([buffer], filename);

  return navigator.share({ files: [file] })
}
