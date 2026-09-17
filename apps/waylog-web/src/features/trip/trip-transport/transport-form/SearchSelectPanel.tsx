import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import {
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState, type ReactNode } from 'react'

interface Props<T> {
  title: string
  placeholder: string
  search: (keyword: string) => T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactNode
  onSelect: (item: T) => void
  onClose: () => void
}

// 인라인 결과가 아니라 전체 화면이다. 입력과 동시에 목록이 펼쳐지면
// 아래 필드들이 밀려 내려간다.
// 진행 스텝은 아니다 -- 필드 하나를 채우는 보조 동작이라 퍼널 밖에 있다.
export function SearchSelectPanel<T>({
  title,
  placeholder,
  search,
  getKey,
  renderItem,
  onSelect,
  onClose,
}: Props<T>) {
  const [keyword, setKeyword] = useState('')
  const results = useMemo(() => search(keyword), [keyword, search])

  // 목록만 스크롤한다. 제목과 입력이 같이 밀려 올라가면 무엇을 고르는
  // 중이었는지 잃고, 좁히려 해도 입력까지 되돌아가야 한다.
  return (
    <Stack height="100%" overflow="hidden">
      <Stack p={2} gap={2} flexShrink={0}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography fontSize={17} fontWeight={700}>
            {title}
          </Typography>
          <IconButton aria-label="닫기" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        <TextField
          placeholder={placeholder}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          autoFocus
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" color="disabled" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Stack flex={1} minHeight={0} px={2} pb={2} sx={{ overflowY: 'auto' }}>
        {results.length > 0 && (
          <Stack border="1px solid" borderColor="divider" borderRadius={2} overflow="hidden">
            {results.map((item, index) => (
              <Box
                key={getKey(item)}
                p={1.5}
                borderTop={index === 0 ? undefined : '1px solid'}
                borderColor="divider"
                onClick={() => onSelect(item)}
                sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              >
                {renderItem(item)}
              </Box>
            ))}
          </Stack>
        )}

        {results.length === 0 && (
          <Typography variant="caption" color="text.secondary" textAlign="center" py={4}>
            검색 결과가 없어요.
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
