import { MaterialIcons } from '@expo/vector-icons'
import { useState } from 'react'
import { Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BottomSheet } from './bottom-sheet/BottomSheet'
import { ListItem } from './ListItem'
import { Button, Stack, Typography } from '~/shared/components/design-system'
import { palette } from '../config/tokens'
import { useOverlay } from '../hooks/useOverlay'
import { getDisplayLabel, type MultiSelectDropdownOption } from './multiSelectDropdown.utils'

export type { MultiSelectDropdownOption }

interface MultiSelectDropdownProps {
  value: string[]
  options: MultiSelectDropdownOption[]
  placeholder: string
  onChange: (value: string[]) => void
}

// 웹은 앵커 드롭다운을 연다. 네이티브에는 그 개념이 없고 다중 선택이므로
// 트리거만 드롭다운 모양으로 두고 목록은 바텀시트로 띄운다.
export function MultiSelectDropdown({
  value,
  options,
  placeholder,
  onChange,
}: MultiSelectDropdownProps) {
  const overlay = useOverlay()

  return (
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        height: 34,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: palette.divider,
        backgroundColor: 'rgba(255,255,255,0.92)',
      }}
    >
      <Typography variant="body2" numberOfLines={1} style={{ fontSize: 13, maxWidth: 180 }}>
        {getDisplayLabel(value, options, placeholder)}
      </Typography>
      <MaterialIcons name="keyboard-arrow-down" size={18} color={palette.textSecondary} />
    </Pressable>
  )
}

interface MultiSelectSheetProps extends MultiSelectDropdownProps {
  isOpen: boolean
  onClose: () => void
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
    <BottomSheet isOpen={isOpen} onDismiss={onClose} snapPoints={[0.7]} defaultSnapIndex={0}>
      <BottomSheet.Header>{placeholder}</BottomSheet.Header>
      <BottomSheet.Body style={{ paddingHorizontal: 16 }}>
        <Stack gap={0.5}>
          {options.map((option) => (
            <ListItem.Button
              key={option.value}
              focused={picked.includes(option.value)}
              onPress={() => toggle(option.value)}
              rightAddon={
                picked.includes(option.value) ? (
                  <MaterialIcons name="check-circle" size={20} color={palette.primary} />
                ) : undefined
              }
            >
              <ListItem.Title>{option.label}</ListItem.Title>
            </ListItem.Button>
          ))}
        </Stack>
      </BottomSheet.Body>
      <BottomSheet.BottomActions style={{ paddingBottom: insets.bottom + 8 }}>
        <Button variant="outlined" fullWidth onPress={() => setPicked([])}>
          초기화
        </Button>
        <Button
          variant="contained"
          fullWidth
          onPress={() => {
            onChange(picked)
            onClose()
          }}
        >
          적용 ({picked.length})
        </Button>
      </BottomSheet.BottomActions>
    </BottomSheet>
  )
}
