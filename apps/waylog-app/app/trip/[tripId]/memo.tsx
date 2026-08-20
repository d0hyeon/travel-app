import { Box, Typography } from '../../../src/shared/components/mui'

// 웹 화면 이관 예정. 현재는 장소 탭만 완료됐다.
export default function Placeholder() {
  return (
    <Box sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h6">메모</Typography>
    </Box>
  )
}
