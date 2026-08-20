import { Switch as RNSwitch } from 'react-native'
import { palette } from '../../config/tokens'

export interface SwitchProps {
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (event: unknown, checked: boolean) => void
}

// 웹 MUI Switch 의 onChange(event, checked) 시그니처를 맞춘다.
export function Switch({ defaultChecked, checked, onChange }: SwitchProps) {
  return (
    <RNSwitch
      value={checked ?? defaultChecked ?? false}
      onValueChange={(next) => onChange?.(null, next)}
      trackColor={{ true: palette.primary, false: palette.divider }}
    />
  )
}
