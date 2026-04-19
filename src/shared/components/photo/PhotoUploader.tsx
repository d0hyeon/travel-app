import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, CircularProgress, IconButton, Stack, Typography, type BoxProps } from '@mui/material';
import { useEffect, useRef, useState, useTransition } from 'react';

export interface PhotoUploadItem {
  file: File;
  isPublic: boolean;
}

export interface PhotoUploadValue {
  item?: PhotoUploadItem;
  items?: PhotoUploadItem[];
}

interface PendingPhotoUploadItem extends PhotoUploadItem {
  previewUrl: string;
}

interface PhotoUploaderProps extends BoxProps {
  onUpload: (value: PhotoUploadValue) => Promise<unknown>;
  multiple?: boolean;
  loading?: boolean;
  accept?: string | string[];
}

export function PhotoUploader({
  onUpload,
  multiple,
  loading,
  accept = 'image/*',
  ...props
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const accepts = Array.isArray(accept) ? accept : [accept];
  const [pendingItems, setPendingItems] = useState<PendingPhotoUploadItem[]>([]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const [isLoading, startUpload] = useTransition();

  useEffect(() => {
    return () => {
      pendingItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [pendingItems]);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    startUpload(async () => {
      if (e.target.files != null) {
        if (multiple) {
          const files = filterByMIME(e.target.files, accepts);
          if (files.length) {
            setPendingItems((current) => [
              ...current,
              ...files.map((file) => ({
                file,
                isPublic: false,
                previewUrl: URL.createObjectURL(file),
              })),
            ]);
          }

        } else {
          const file = e.target.files[0];
          if (isValidFile(file, accepts)) {
            await onUpload({ item: { file, isPublic: false } });
          }
        }
        e.target.value = '';
      }
    })

  };

  return (
    <Box width="96px" {...props}>
      <input
        ref={inputRef}
        type="file"
        accept={accepts.join('')}
        onChange={handleChange}
        style={{ display: 'none' }}
        multiple={multiple}
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
      {multiple && pendingItems.length > 0 && (
        <Stack
          spacing={1}
          mt={1}
          p={1}
          borderRadius={2}
          sx={{
            width: 220,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            업로드 후 상세 보기 메뉴에서 공개 여부를 바꿀 수 있습니다.
          </Typography>
          {pendingItems.map((item, index) => (
            <Stack
              key={`${item.file.name}-${item.file.lastModified}-${index}`}
              direction="row"
              spacing={1}
              alignItems="center"
            >
              <Box
                component="img"
                src={item.previewUrl}
                alt={item.file.name}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
              <Box minWidth={0} flex={1}>
                <Typography variant="caption" display="block" noWrap>
                  {item.file.name}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => {
                  setPendingItems((current) => {
                    const target = current[index];
                    if (target) {
                      URL.revokeObjectURL(target.previewUrl);
                    }
                    return current.filter((_, currentIndex) => currentIndex !== index);
                  });
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <Button
            variant="contained"
            disabled={isLoading || loading || pendingItems.length === 0}
            onClick={() => startUpload(async () => {
              const items = pendingItems.map(({ file, isPublic }) => ({ file, isPublic }));
              await onUpload({ items });
              pendingItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
              setPendingItems([]);
            })}
          >
            업로드 ({pendingItems.length})
          </Button>
        </Stack>
      )}
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
