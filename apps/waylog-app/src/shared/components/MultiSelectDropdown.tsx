import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { StyleSheet, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheet } from './bottom-sheet/BottomSheet'
import { ListItem } from './ListItem'
import { Button, GlassSurface, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../config/tokens'
import { useOverlay } from '../hooks/useOverlay'
import { getDisplayLabel, type MultiSelectDropdownOption } from './multiSelectDropdown.utils'

export type { MultiSelectDropdownOption }

const GLASS_TINT = 'rgba(251,251,253,0.55)'

interface MultiSelectDropdownProps {
  value: string[]
  options: MultiSelectDropdownOption[]
  placeholder: string
  onChange: (value: string[]) => void
  variant?: 'outlined' | 'glass'
}

// 웹은 앵커 드롭다운을 연다. 네이티브에는 그 개념이 없고 다중 선택이므로
// 트리거만 드롭다운 모양으로 두고 목록은 바텀시트로 띄운다.
export function MultiSelectDropdown({
  value,
  options,
  placeholder,
  onChange,
  variant = 'outlined',
}: MultiSelectDropdownProps) {
  const overlay = useOverlay()

  const trigger = (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        overlay.open(({ isOpen, close }) => (
          <MultiSelectSheet
            isOpen={isOpen}
            onClose={close}
            placeholder={placeholder}
            options={options}
            value={value}
            onChange={onChange}
          />
        ))
      }
      style={[styles.pressable, variant === 'outlined' && styles.outlined]}
    >
      <Typography variant="body2" numberOfLines={1} style={styles.typography}>
        {getDisplayLabel(value, options, placeholder)}
      </Typography>
      <MaterialIcons name="keyboard-arrow-down" size={18} color={palette.textSecondary} />
    </Pressable>
  )

  if (variant === 'glass') {
    return (
      <View style={styles.glassShadow}>
        <GlassSurface fallbackBlurIntensity={40} tintColor={GLASS_TINT} style={styles.glass}>
          {trigger}
        </GlassSurface>
      </View>
    )
  }

  return trigger
}

interface MultiSelectSheetProps extends MultiSelectDropdownProps {
  isOpen: boolean
  onClose: () => Promise<void>
}

function MultiSelectSheet({
  isOpen,
  onClose,
  value,
  options,
  placeholder,
  onChange,
}: MultiSelectSheetProps) {
  const [picked, setPicked] = useState(value)
  const insets = useSafeAreaInsets()

  const toggle = (optionValue: string) =>
    setPicked((curr) =>
      curr.includes(optionValue) ? curr.filter((x) => x !== optionValue) : [...curr, optionValue],
    )

  return (
    <BottomSheet isOpen={isOpen} onDismiss={onClose} >
      <BottomSheet.Header>{placeholder}</BottomSheet.Header>
      <BottomSheet.Body style={styles.multiSelectSheetBody}>
        <Stack gap={0.5} style={{ marginBottom: 16 }}>
          {options.map((option) => (
            <ListItem.Button
              key={option.value}
              onPress={() => toggle(option.value)}
              style={styles.menuItem}
              rightAddon={
                picked.includes(option.value) ? (
                  <MaterialIcons name="check" size={20} color={palette.primary} />
                ) : undefined
              }
            >
              <ListItem.Title>{option.label}</ListItem.Title>
            </ListItem.Button>
          ))}
        </Stack>
      </BottomSheet.Body>
      <BottomSheet.BottomActions style={{ paddingBottom: insets.bottom + 8 }}>
        <Button
          size="large"
          variant="outlined"
          fullWidth
          onPress={onClose}>
          닫기
        </Button>
        <Button
          variant="contained"
          fullWidth
          size="large"
          onPress={async () => {
            await onClose()
            onChange(picked)
          }}
        >
          적용
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 34,
    paddingHorizontal: 12,
  },
  outlined: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.divider,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  glass: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  glassShadow: { borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 8 },
  typography: {
    fontSize: 13,
    maxWidth: 180,
  },
  multiSelectSheetBody: {
    paddingHorizontal: 16,

  },
  menuItem: {
    paddingHorizontal: 8, paddingVertical: 12,
    borderWidth: 0
  },
})
