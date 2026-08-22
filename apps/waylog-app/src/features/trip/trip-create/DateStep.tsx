import { formatDate } from 'date-fns'
import { useState } from 'react'
import { BottomArea } from '../../../shared/components/BottomArea'
import { DatePicker } from '../../../shared/components/date-picker'
import type { DateSelection } from '../../../shared/components/date-picker'
import { Button } from '../../../shared/components/mui'

interface Props {
  defaultValue: [string, string] | null
  onNext: (startDate: string, endDate: string) => void
}

export function DateStep({ defaultValue, onNext }: Props) {
  const [selection, setSelection] = useState<DateSelection>(() =>
    defaultValue ? [new Date(defaultValue[0]), new Date(defaultValue[1])] : [null, null],
  )

  const [start, end] = selection
  // 웹은 allowSingleDay 라 하루만 골라도 넘어간다. 끝을 시작으로 채운다.
  const isEmpty = start == null

  return (
    <>
      <DatePicker
        type="range"
        value={selection}
        onChange={setSelection}
      />
      <BottomArea position="fixed" bottom={0}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isEmpty}
          onClick={() => {
            if (start == null) return
            onNext(formatDate(start, 'yyyy-MM-dd'), formatDate(end ?? start, 'yyyy-MM-dd'))
          }}
        >
          다음
        </Button>
      </BottomArea>
    </>
  )
}
