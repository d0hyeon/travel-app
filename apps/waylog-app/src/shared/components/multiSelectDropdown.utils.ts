export interface MultiSelectDropdownOption {
  value: string
  label: string
}

// 웹 MultiSelectDropdown 의 표기 규칙을 그대로 따른다.
export function getDisplayLabel(
  selected: string[],
  options: MultiSelectDropdownOption[],
  placeholder: string,
): string {
  const labels = options
    .filter((option) => selected.includes(option.value))
    .map((option) => option.label)

  // 웹은 selected 길이만 보고 분기해 라벨이 비면 "undefined 외 -1" 을 만든다.
  // 실제로 표시할 라벨을 기준으로 판단한다.
  if (labels.length === 0) return placeholder

  if (labels.length === 1) return labels[0] ?? placeholder
  if (labels.length === 2) return labels.join(', ')

  return `${labels[0]} 외 ${labels.length - 1}`
}
