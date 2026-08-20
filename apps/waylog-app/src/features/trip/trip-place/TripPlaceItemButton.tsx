import styled from '@emotion/native'
import type { TripPlace } from '@waylog/domains/place'
import { Text } from '../../../shared/components'
import { palette, radius } from '../../../shared/config/tokens'

const Root = styled.Pressable<{ focused: boolean; planned: boolean }>`
  padding: 10px 12px;
  border-radius: ${radius.md}px;
  border-width: 1px;
  border-color: ${({ focused, planned }) =>
    focused || planned ? palette.primary : palette.divider};
  background-color: ${({ focused }) => (focused ? '#f2f6ff' : '#fff')};
  gap: 2px;
`

interface Props {
  place: TripPlace
  focused: boolean
  planned: boolean
  onPress: () => void
}

export function TripPlaceItemButton({ place, focused, planned, onPress }: Props) {
  return (
    <Root focused={focused} planned={planned} onPress={onPress}>
      <Text variant="body2" bold numberOfLines={1}>
        {place.name}
      </Text>
      {place.memo != null && place.memo !== '' && (
        <Text variant="caption" color={palette.textSecondary} numberOfLines={1}>
          {place.memo}
        </Text>
      )}
    </Root>
  )
}
