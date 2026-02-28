import { ImageListItem, type ImageListItemProps } from '@mui/material';



type ItemProps = {
  src: string;
} & ImageListItemProps;

export function PhotoThunbnail({ src, sx, ...props }: ItemProps) {
  return (
    <ImageListItem
      sx={[
        { cursor: 'pointer', borderRadius: 3, overflow: 'hidden' },
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
    </ImageListItem>
  )
}