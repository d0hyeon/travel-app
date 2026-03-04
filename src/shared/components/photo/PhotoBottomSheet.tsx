import { Box, Button, IconButton, Typography } from "@mui/material";
import { useEffect, useEffectEvent, useRef, useState, type ComponentProps } from "react";
import { Swiper, SwiperSlide, type SwiperRef } from 'swiper/react';
import type { Photo } from "~features/photo/photo.types";
import { BottomSheet } from "~shared/components/BottomSheet";
import DownloadIcon from '@mui/icons-material/Downloading';

// @ts-ignore
import 'swiper/css';
// @ts-ignore
import 'swiper/css/virtual';

import { useConfirmDialog } from "~shared/modules/confirm-dialog/useConfirmDialog";
import { ZoomArea } from "../ZoomArea";
import { Virtual } from 'swiper/modules';


type SheetProps = {
  photos: Photo[];
  onDelete?: (photo: Photo) => void;
  initialIndex?: number
} & Omit<ComponentProps<typeof BottomSheet>, 'children'>;

export function PhotoBottomSheet({ photos: _photos, initialIndex = 0, onDelete, onClose, ...props }: SheetProps) {
  const [index, setIndex] = useState(initialIndex);
  const [photos, setPhotos] = useState(_photos);
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
        <IconButton
          onClick={() => downloadRemoteSource(photos[index].url)}
          sx={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}
        >
          <DownloadIcon sx={{ color: '#fff' }} />
        </IconButton>
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
                  onZoomStart={() => swiperRef.current?.swiper.disable()}
                  onZoomEnd={() => swiperRef.current?.swiper.enable()}
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
  const blob = await response.blob();

  const anchor = document.createElement('a');
  const [filename] = url.split('/').reverse();
  anchor.download = filename;
  anchor.href = URL.createObjectURL(blob);

  document.body.append(anchor);
  anchor.click()

  document.body.removeChild(anchor);
  URL.revokeObjectURL(anchor.href);
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
