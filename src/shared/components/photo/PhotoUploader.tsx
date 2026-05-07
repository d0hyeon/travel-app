import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import { Box, CircularProgress, IconButton, type BoxProps } from '@mui/material'
import { useRef, useTransition } from 'react'

interface PhotoUploaderProps extends BoxProps {
  onUpload: (files: File[]) => Promise<unknown>
  multiple?: boolean
  loading?: boolean
  accept?: string | string[]
}

export function PhotoUploader({
  onUpload,
  multiple,
  loading,
  accept = 'image/*',
  ...props
}: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const accepts = Array.isArray(accept) ? accept : [accept]
  const [isLoading, startUpload] = useTransition()

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startUpload(async () => {
      if (e.target.files == null) return

      const files = filterByMIME(e.target.files, accepts)
      if (files.length > 0) {
        await onUpload(multiple ? files : files.slice(0, 1))
      }

      e.target.value = ''
    })
  }

  return (
    <Box width="96px" {...props}>
      <input
        ref={inputRef}
        type="file"
        accept={accepts.join(',')}
        onChange={handleChange}
        style={{ display: 'none' }}
        multiple={multiple}
      />
      <IconButton
        onClick={handleClick}
        disabled={isLoading || loading}
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
  )
}

function filterByMIME(files: FileList, accepts: string[]) {
  return Array.from(files).filter((file) => {
    return accepts.some((accept) => isValidMIME(accept, file.type))
  })
}

function isValidMIME(base: string, target: string) {
  const [baseType, baseSubType] = base.split('/')
  const [targetType, targetSubType] = target.split('/')

  if (baseType !== targetType) {
    return false
  }
  if (baseSubType === '*') {
    return true
  }

  return baseSubType === targetSubType
}
