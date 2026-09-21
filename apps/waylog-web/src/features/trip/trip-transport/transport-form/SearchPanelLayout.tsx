import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  title: string
  placeholder: string
  keyword: string
  onKeywordChange: (next: string) => void
  isEmpty: boolean
  children: ReactNode
  onClose: () => void
}

// 인라인 결과가 아니라 전체 화면이다. 입력과 동시에 목록이 펼쳐지면
// 아래 필드들이 밀려 내려간다.
// 진행 스텝은 아니다 -- 필드 하나를 채우는 보조 동작이라 퍼널 밖에 있다.
//
// 무엇을 찾는지는 모른다 -- 껍데기만 든다. 대상을 아는 것은 각 패널이다.
export function SearchPanelLayout({
  title,
  placeholder,
  keyword,
  onKeywordChange,
  isEmpty,
  children,
  onClose,
}: Props) {
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
          onChange={(event) => onKeywordChange(event.target.value)}
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
        {!isEmpty && (
          <Stack border="1px solid" borderColor="divider" borderRadius={2} >
            {children}
          </Stack>
        )}

        {isEmpty && (
          <Typography variant="caption" color="text.secondary" textAlign="center" py={4}>
            검색 결과가 없어요.
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
