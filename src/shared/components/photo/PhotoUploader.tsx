import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { Box, CircularProgress, IconButton, type BoxProps } from '@mui/material';
import { useRef } from 'react';

interface PhotoUploaderProps extends BoxProps {
  onUpload: (file: File) => Promise<void>
  isUploading?: boolean
}

export function PhotoUploader({ onUpload, isUploading, ...props }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      e.target.value = '';
    }
  };

  return (
    <Box width="80px" {...props}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <IconButton
        onClick={handleClick}
        disabled={isUploading}
        sx={{
          width: '100%',
          aspectRatio: '1 / 1',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        {isUploading ? (
          <CircularProgress size={24} />
        ) : (
          <AddPhotoAlternateIcon />
        )}
      </IconButton>
    </Box>
  );
}
