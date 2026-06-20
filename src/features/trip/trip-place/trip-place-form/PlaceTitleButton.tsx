import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { ButtonBase, Typography, type TypographyProps } from '@mui/material'

interface PlaceTitleButtonProps {
  /** 표시할 장소명 */
  name: string
  /** 타이틀 클릭 시 장소 상세 오버레이를 띄운다 */
  onClick: () => void
  variant?: TypographyProps['variant']
}

/** 장소 수정 오버레이의 타이틀. 우측 화살표를 눌러 장소 상세로 진입한다. */
export function PlaceTitleButton({ name, onClick, variant = 'h6' }: PlaceTitleButtonProps) {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        gap: 0.25,
        borderRadius: 1,
        py: 0.25,
        px: 0.5,
        mx: -0.5,
        maxWidth: '100%',
        '&:hover': { bgcolor: 'action.hover' },
      }}
    >
      <Typography variant={variant} component="span" noWrap>
        {name}
      </Typography>
      <ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
    </ButtonBase>
  )
}
