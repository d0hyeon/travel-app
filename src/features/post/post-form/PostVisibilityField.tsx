import { FormControl, FormControlLabel, FormHelperText, Radio, RadioGroup, Typography } from '@mui/material'
import { PostVisibility } from '../post.types'

interface Props {
  value: PostVisibility
  onChange: (value: PostVisibility) => void
  /** trip이 없으면 MEMBERS는 선택 불가 */
  hasTripContext: boolean
}

const LABEL: Record<PostVisibility, { title: string; description: string }> = {
  [PostVisibility.PRIVATE]: { title: '나만 보기', description: '본인만 볼 수 있어요' },
  [PostVisibility.MEMBERS]: { title: '여행 멤버', description: '같이 다녀온 사람들에게만 공개' },
  [PostVisibility.PUBLIC]: { title: '전체 공개', description: '누구나 볼 수 있어요' },
}

export function PostVisibilityField({ value, onChange, hasTripContext }: Props) {
  return (
    <FormControl>
      <Typography variant="subtitle2" mb={1}>공개 범위</Typography>
      <RadioGroup
        value={value}
        onChange={(_, next) => onChange(next as PostVisibility)}
      >
        {(Object.keys(LABEL) as PostVisibility[]).map((option) => {
          const disabled = option === PostVisibility.MEMBERS && !hasTripContext
          return (
            <FormControlLabel
              key={option}
              value={option}
              disabled={disabled}
              control={<Radio size="small" />}
              label={
                <>
                  <Typography variant="body2">{LABEL[option].title}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {LABEL[option].description}
                  </Typography>
                </>
              }
            />
          )
        })}
      </RadioGroup>
      {!hasTripContext && (
        <FormHelperText>여행을 선택해야 멤버 공개를 사용할 수 있어요</FormHelperText>
      )}
    </FormControl>
  )
}
