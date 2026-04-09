import CheckIcon from '@mui/icons-material/Check'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import {
  Box,
  Checkbox,
  FormControl,
  ListItemText,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Typography,
} from '@mui/material'

export interface MultiSelectDropdownOption {
  value: string
  label: string
  color?: string
}

interface MultiSelectDropdownProps {
  value: string[]
  options: MultiSelectDropdownOption[]
  placeholder: string
  onChange: (value: string[]) => void
}

export function MultiSelectDropdown({
  value,
  options,
  placeholder,
  onChange,
}: MultiSelectDropdownProps) {
  const handleChange = (event: SelectChangeEvent<string[]>) => {
    const nextValue = event.target.value
    onChange(typeof nextValue === 'string' ? nextValue.split(',') : nextValue)
  }

  return (
    <FormControl size="small" sx={{ minWidth: 160, maxWidth: 280 }}>
      <Select
        multiple
        displayEmpty
        value={value}
        onChange={handleChange}
        IconComponent={KeyboardArrowDownIcon}
        renderValue={(selected) => getDisplayLabel(selected, options, placeholder)}
        sx={{
          height: 34,
          borderRadius: 999,
          bgcolor: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.14)',
          '.MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            py: 0.75,
            pr: 4.5,
            pl: 1.5,
            fontSize: 13,
            fontWeight: 600,
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              borderRadius: 2,
              minWidth: 220,
            },
          },
        }}
      >
        {options.map((option) => {
          const checked = value.includes(option.value)

          return (
            <MenuItem key={option.value} value={option.value} sx={{ gap: 0.5 }}>
              <Checkbox checked={checked} size="small" sx={{ p: 0.5 }} />
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {option.color && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: option.color,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography variant="body2" fontWeight={checked ? 700 : 500}>
                      {option.label}
                    </Typography>
                  </Box>
                }
              />
              {checked && <CheckIcon sx={{ fontSize: 16, color: 'primary.main' }} />}
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )
}

function getDisplayLabel(
  selected: string[],
  options: MultiSelectDropdownOption[],
  placeholder: string,
) {
  if (selected.length === 0) return placeholder

  const labels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label)

  if (labels.length === 1) return labels[0] ?? placeholder
  if (labels.length === 2) return labels.join(', ')

  return `${labels[0]} 외 ${labels.length - 1}`
}
