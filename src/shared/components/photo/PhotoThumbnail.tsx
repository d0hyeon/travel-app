import { ImageListItem, type ImageListItemProps } from '@mui/material';
import { PhotoVisibilityBadge } from './PhotoVisibilityBadge';



type ItemProps = {
  src: string;
  isPublic?: boolean;
} & ImageListItemProps;

export function PhotoThunbnail({ src, isPublic = false, sx, ...props }: ItemProps) {
  return (
    <ImageListItem
      sx={[
        { cursor: 'pointer', borderRadius: 3, overflow: 'hidden', position: 'relative' },
        ({ palette }) => ({ border: `1px solid ${palette.divider}` }),
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
      {...props}
    >
      <img
        src={src}
        alt=""
        loading="lazy"
        style={{ aspectRatio: '1', objectFit: 'cover' }}
      />
      {isPublic && <PhotoVisibilityBadge sx={{ position: 'absolute', top: 4, left: 4, zIndex: 1 }} />}
    </ImageListItem>
  )
}
