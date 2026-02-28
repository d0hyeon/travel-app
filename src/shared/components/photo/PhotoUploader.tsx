import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { Box, CircularProgress, IconButton, type BoxProps } from '@mui/material';
import { useRef, useTransition } from 'react';

interface PhotoUploaderProps<Multiple extends boolean> extends BoxProps {
  onUpload: (file: Multiple extends true ? File[] : File) => Promise<unknown>;
  multiple?: Multiple;
  loading?: boolean;
  accept?: string | string[];
}

export function PhotoUploader<Multiple extends boolean = false>({
  onUpload,
  multiple,
  loading,
  accept = 'image/*',
  ...props
}: PhotoUploaderProps<Multiple>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accepts = Array.isArray(accept) ? accept : [accept];

  const handleClick = () => {
    inputRef.current?.click();
  };

  const [isLoading, startUpload] = useTransition();

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    startUpload(async () => {
      if (e.target.files != null) {
        if (multiple) {
          const files = filterByMIME(e.target.files, accepts);
          if (files.length) {
            // @ts-ignore
            await onUpload(files)
          }

        } else {
          const file = e.target.files[0];
          if (isValidFile(file, accepts)) {
            // @ts-ignore
            await onUpload(file);
          }
        }
        e.target.value = '';
      }
    })

  };

  return (
    <Box width="80px" {...props}>
      <input
        ref={inputRef}
        type="file"
        accept={accepts.join('')}
        onChange={handleChange}
        style={{ display: 'none' }}
        multiple
      />
      <IconButton
        onClick={handleClick}
        disabled={isLoading}
        sx={{
          width: '100%',
          aspectRatio: '1 / 1',
          border: '2px dashed',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        {isLoading || loading ? (
          <CircularProgress size={24} />
        ) : (
          <AddPhotoAlternateIcon />
        )}
      </IconButton>
    </Box>
  );
}

function filterByMIME(files: FileList, accepts: string[]) {
  return Array.from(files).filter((file) => {
    return accepts.some((accept) => isValidMIME(accept, file.type));
  });
}

function isValidFile(file: File, accepts: string[]) {
  return accepts.some((accept) => isValidMIME(accept, file.type))
}

function isValidMIME(base: string, target: string) {
  const [baseType, baseSubType] = base.split('/');
  const [targetType, targetSubType] = target.split('/');

  if (baseType !== targetType) {
    return false;
  }
  if (baseSubType === '*') {
    return true;
  }

  return baseSubType === targetSubType;
}
