import { Box, Button, Typography } from "@mui/material";
import { useRef, useState, type ComponentProps } from "react";
import { Swiper, SwiperSlide, type SwiperRef } from 'swiper/react';
import type { Photo } from "~features/photo/photo.types";
import { BottomSheet } from "~shared/components/BottomSheet";

// @ts-ignore
import 'swiper/css';
import { useConfirmDialog } from "~shared/modules/confirm-dialog/useConfirmDialog";

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
        swiperRef.current?.swiper.slideNext(500);
        await delay(500);
      }
      setPhotos((curr) => curr.filter(x => x.id !== photo.id))
      onDelete?.(photo);

    }
  }
  return (
    <BottomSheet
      snapPoints={[0.95]}
      defaultSnapIndex={0}
      onClose={onClose}
      sx={{ backgroundColor: '#010101' }}
      {...props}
    >
      <BottomSheet.Header alignItems="center" justifyContent="center" marginBottom={1}>
        <Typography variant="body2" color="#fff" fontWeight={800}>
          {index + 1} / {photos.length}
        </Typography>
      </BottomSheet.Header>
      <BottomSheet.Body>
        <BottomSheet.Scrollable display="flex" alignItems="center" justifyContent="center" height="100%">
          <Swiper
            ref={swiperRef}
            slidesPerView={1}
            loop
            initialSlide={initialIndex}
            onSlideChange={({ realIndex }) => setIndex(realIndex)}
            style={{ height: '100%', width: '100%' }}
          >
            {photos.map((item, i) => (
              <SwiperSlide key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box
                  component="img"
                  src={item.url}
                  maxHeight="100%"
                  sx={{ objectFit: 'contain' }}
                  ref={index === i ? currentImageRef : undefined}
                />
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

function delay(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms)
  })
}