import { formatDate } from 'date-fns'
import { DateCalendarBoard } from '~shared/components/date-range/DateCalendarBoard'
import type { DateRange } from '~shared/components/date-range/type'

interface Props {
  defaultValue: [string, string] | null
  onNext: (startDate: string, endDate: string) => void
}

export function DateStep({ defaultValue, onNext }: Props) {
  const defaultDateRange: DateRange | undefined = defaultValue
    ? [new Date(defaultValue[0]), new Date(defaultValue[1])]
    : undefined

  return (
    <DateCalendarBoard
      defaultValue={defaultDateRange}
      onChange={([start, end]) => {
        onNext(
          formatDate(start, 'yyyy-MM-dd'),
          formatDate(end, 'yyyy-MM-dd')
        )
      }}
    />
  )
}
