import { PostVisibility, type PostVisibility as PostVisibilityValue } from '@waylog/domains/modules/post'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Typography } from '../../../shared/components/mui'
import { palette, radius } from '../../../shared/config/tokens'

export const VISIBILITY_OPTIONS = [
  { value: PostVisibility.PRIVATE, label: '나만 보기', description: '본인만 볼 수 있어요' },
  { value: PostVisibility.MEMBERS, label: '여행 멤버', description: '같이 다녀온 사람들에게만 공개' },
  { value: PostVisibility.PUBLIC, label: '전체 공개', description: '누구나 볼 수 있어요' },
] as const

interface Props {
  defaultValue: PostVisibilityValue
  onChange: (value: PostVisibilityValue) => void
  hasTripContext: boolean
}

export function PostVisibilityField({ defaultValue, onChange, hasTripContext }: Props) {
  const [value, setValue] = useState(defaultValue)

  return (
    <View style={{ borderWidth: 1, borderColor: palette.divider, borderRadius: radius.lg, overflow: 'hidden' }}>
      {VISIBILITY_OPTIONS.map((option) => {
        const disabled = option.value === PostVisibility.MEMBERS && !hasTripContext
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            disabled={disabled}
            onPress={() => {
              onChange(option.value)
              setValue(option.value)
            }}
            style={{
              minHeight: 56,
              paddingHorizontal: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: selected ? palette.primaryContainer : palette.background,
              opacity: disabled ? 0.4 : 1,
            }}
          >
            <Typography variant="body2">{option.label}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.description}
            </Typography>
          </Pressable>
        )
      })}
    </View>
  )
}
