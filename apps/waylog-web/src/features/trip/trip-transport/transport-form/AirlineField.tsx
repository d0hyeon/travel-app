import SearchIcon from '@mui/icons-material/Search'
import { InputAdornment, TextField } from '@mui/material'
import { useWatch, type Control, type UseFormSetValue } from 'react-hook-form'
import { useAirlineSelectOverlay } from './useAirlineSelectOverlay'
import type { TransportFormValues } from './transportForm.types'

interface Props {
  control: Control<TransportFormValues>
  setValue: UseFormSetValue<TransportFormValues>
}

// 항공사를 고르는 일과 그 결과를 폼에 반영하는 일이 한 책임이다.
export function AirlineField({ control, setValue }: Props) {
  const airlineSelect = useAirlineSelectOverlay()
  const airline = useWatch({ control, name: 'airline' })

  // shouldValidate 가 없으면 다 채워도 isValid 가 그대로라 버튼이 잠긴다.
  const select = async () => {
    const selected = await airlineSelect.open()
    if (selected == null) return

    setValue('airline', selected.nameKo, { shouldValidate: true })
    setValue('airlineCode', selected.code, { shouldValidate: true })
  }

  return (
    <TextField
      placeholder="목록에서 선택"
      value={airline ?? ''}
      onClick={select}
      fullWidth
      slotProps={{
        input: {
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <SearchIcon fontSize="small" color="disabled" />
            </InputAdornment>
          ),
        },
      }}
      sx={{ '.MuiInputBase-root': { cursor: 'pointer' }, input: { cursor: 'pointer' } }}
    />
  )
}
