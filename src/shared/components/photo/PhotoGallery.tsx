import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, IconButton, ImageList, ImageListItem, Stack, type ImageListItemProps } from '@mui/material';
import { useIsMobile } from '~shared/hooks/useIsMobile';
import { useOverlay } from '~shared/hooks/useOverlay';
import type { Photo } from '../../../features/photo/photo.types';
import { BottomSheet } from '../BottomSheet';
import { useConfirmDialog } from '~shared/modules/confirm-dialog/useConfirmDialog';

interface PhotoGalleryProps {
  photos: Photo[]
  onDelete?: (photo: Photo) => void
  columns?: number
}

export function PhotoGallery({ photos, onDelete, columns = 4 }: PhotoGalleryProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <ImageList cols={columns} gap={8}>
      {photos.map((photo) => (
        <PhotoGallery.Item key={photo.id} photo={photo} onDelete={onDelete} />
      ))}
    </ImageList>
  );
}


type ItemProps = {
  photo: Photo;
  onDelete?: (photo: Photo) => void;
} & Omit<ImageListItemProps, 'onClick'>;

PhotoGallery.Item = ({ photo, sx, onDelete, ...props }: ItemProps) => {
  const overlay = useOverlay();
  const isMobile = useIsMobile();
  const confirm = useConfirmDialog();

  const openBottomSheet = (photo: Photo) => {
    overlay.open(({ isOpen, close }) => {
      const handleDelete = async () => {
        if (await confirm('추억을 지우시겠어요?')) {
          close();
          onDelete?.(photo);
        }
      }
      return (
        <BottomSheet
          isOpen={isOpen}
          snapPoints={[0.95]}
          defaultSnapIndex={0}
          onClose={close}
        >
          <BottomSheet.Body>
            <BottomSheet.Scrollable display="flex" alignItems="center" justifyContent="center" height="100%">
              <Box component="img" src={photo.url} maxWidth="100%" sx={{ objectFit: 'contain' }} />
            </BottomSheet.Scrollable>
          </BottomSheet.Body>
          <BottomSheet.BottomActions>
            {onDelete && (
              <Button size="large" variant='outlined' color="error" sx={{ flex: ' 0 0 auto' }} onClick={handleDelete}>삭제</Button>
            )}
            <Button size="large" variant="contained" fullWidth onClick={close}>닫기</Button>
          </BottomSheet.BottomActions>
        </BottomSheet >
      )
    })
  }

  const openDialog = (photo: Photo) => {
    overlay.open(({ isOpen, close }) => (
      <Dialog
        open={isOpen}
        onClose={close}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { bgcolor: 'black', maxHeight: isMobile ? '100vh' : '90vh' }
        }}
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
              <IconButton
                onClick={() => {
                  close();
                  onDelete(photo);
                }}
                sx={{ color: 'white' }}
              >
                <DeleteIcon />
              </IconButton>
            )}
            <IconButton
              onClick={close}
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
            <Box component="img" src={photo.url} maxWidth="100%" maxHeight="calc(90vh - 100px)" sx={{ objectFit: 'contain' }} />
          </Box>
        </Stack>
      </Dialog>
    ))
  }

  return (
    <ImageListItem
      {...props}
      sx={[
        { cursor: 'pointer', borderRadius: 3, overflow: 'hidden' },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      onClick={() => isMobile ? openBottomSheet(photo) : openDialog(photo)}
    >
      <img
        src={photo.url}
        alt=""
        loading="lazy"
        style={{ aspectRatio: '1', objectFit: 'cover' }}
      />
    </ImageListItem>
  )
}