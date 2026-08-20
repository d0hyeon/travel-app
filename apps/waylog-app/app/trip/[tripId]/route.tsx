import { Stack, Text } from '../../../src/shared/components'

// 브랜치 1 은 셸만 세운다. 내용은 이후 브랜치에서 채운다.
export default function TripDetailRouteRoute() {
  return (
    <Stack gap={8} align="center" justify="center" style={{ flex: 1 }}>
      <Text variant="h6" bold>계획</Text>
    </Stack>
  )
}
