import CheckIcon from '@mui/icons-material/Check';
import { Box, Button, IconButton, ListSubheader, Typography } from "@mui/material";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Menu, MenuItem, Stack } from "@mui/material";
import { useEffect, useEffectEvent, useRef, useState, type ComponentProps } from "react";
import { Swiper, SwiperSlide, type SwiperRef } from 'swiper/react';
import type { Photo } from "~features/photo/photo.types";
import { BottomSheet } from "~shared/components/bottom-sheet/BottomSheet";
import DownloadIcon from '@mui/icons-material/Downloading';

// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/virtual';

import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { ZoomArea } from "../ZoomArea";
import { Virtual } from 'swiper/modules';


type SheetProps = {
  photos: Photo[];
  onDelete?: (photo: Photo) => void;
  onUpdateVisibility?: (photo: Photo, isPublic: boolean) => Promise<unknown>;
  initialIndex?: number
} & Omit<ComponentProps<typeof BottomSheet>, 'children'>;

export function PhotoBottomSheet({ photos: _photos, initialIndex = 0, onDelete, onUpdateVisibility, onClose, ...props }: SheetProps) {
  const [index, setIndex] = useState(initialIndex);
  const [photos, setPhotos] = useState(_photos);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const confirm = useConfirmDialog();

  const currentImageRef = useRef<HTMLImageElement>(null);
  const swiperRef = useRef<SwiperRef>(null);

  const handleDelete = async () => {
    const photo = photos.at(index);
    if (photo == null || currentImageRef.current == null) {
      return;
    }
    if (await confirm('추억을 지우시겠어요?')) {
      const animation = currentImageRef.current.animate({
        opacity: 0,
      }, { duration: 1000, fill: 'forwards' });

      await animation.finished;
      const needsClose = photos.length === 1;
      if (needsClose) {
        onClose?.();
      } else {
        setPhotos((curr) => curr.filter(x => x.id !== photo.id))
      }
      onDelete?.(photo);

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

  useGestureStart(() => swiperRef.current?.swiper.disable())

  return (
    <BottomSheet
      snapPoints={[0.95]}
      defaultSnapIndex={0}
      onClose={onClose}
      sx={{ backgroundColor: '#010101' }}
      {...props}
    >
      <BottomSheet.Header alignItems="center" justifyContent="center" position="relative" marginBottom={1}>
        <Typography variant="body2" color="#fff" fontWeight={800}>
          {index + 1} / {photos.length}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}>
          {onUpdateVisibility && (
            <>
              <IconButton onClick={(event) => setMenuAnchorEl(event.currentTarget)}>
                <MoreVertIcon sx={{ color: '#fff' }} />
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
                <MenuItem
                  onClick={() => {
                    downloadRemoteSource(photos[index].url);
                    setMenuAnchorEl(null);
                  }}
                  sx={{ minHeight: 40 }}
                >
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
                <MenuItem onClick={() => void handleChangeVisibility(true)} sx={{ minHeight: 40, paddingLeft: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                    <Box>공개</Box>
                    {photos[index]?.isPublic && <CheckIcon fontSize="small" />}
                  </Stack>
                </MenuItem>
                <MenuItem onClick={() => void handleChangeVisibility(false)} sx={{ minHeight: 40, paddingLeft: 3 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
                    <Box>비공개</Box>
                    {!photos[index]?.isPublic && <CheckIcon fontSize="small" />}
                  </Stack>
                </MenuItem>

              </Menu>
            </>
          )}
        </Stack>
      </BottomSheet.Header>
      <BottomSheet.Body>
        <BottomSheet.Scrollable display="flex" alignItems="center" justifyContent="center" height="100%">
          <Swiper
            ref={swiperRef}
            slidesPerView={1}
            initialSlide={initialIndex}
            onSlideChange={({ realIndex }) => setIndex(realIndex)}
            style={{ height: '100%', width: '100%' }}
            modules={[Virtual]}
            virtual
            loop
          >
            {photos.map((item, i) => (
              <SwiperSlide key={item.id}>
                <ZoomArea
                  width="100%"
                  height="100%"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  onZoomStart={() => swiperRef.current?.swiper?.disable?.()}
                  onZoomEnd={() => swiperRef.current?.swiper?.enable?.()}
                >
                  <Box
                    component="img"
                    src={item.url}
                    maxHeight="100%"
                    sx={{ objectFit: 'contain' }}
                    ref={index === i ? currentImageRef : undefined}
                  />
                </ZoomArea>
              </SwiperSlide>
            ))}
          </Swiper>

        </BottomSheet.Scrollable>
      </BottomSheet.Body>
      <BottomSheet.BottomActions>
        {onDelete && (
          <Button
            size="large"
            variant='outlined'
            color="error"
            sx={{
              flex: ' 0 0 auto',
              backgroundColor: '#000',
              color: '#fba7a7',
              borderColor: '#4e4343'
            }}
            onClick={handleDelete}
          >
            삭제
          </Button>
        )}
        <Button size="large" variant="contained" fullWidth onClick={onClose}>닫기</Button>
      </BottomSheet.BottomActions>
    </BottomSheet >
  )
}

async function downloadRemoteSource(url: string) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();

  const [filename] = url.split('/').reverse();
  const file = new File([buffer], filename);

  return navigator.share({ files: [file] })
}

function useGestureStart(callback: () => void) {
  const preservedCallback = useEffectEvent(callback);

  useEffect(() => {
    const handler = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        preservedCallback();
      }
    };

    document.addEventListener('touchstart', handler);

    return () => document.removeEventListener('touchstart', handler);
  }, []);
}
