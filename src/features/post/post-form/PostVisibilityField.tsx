import { List, ListItemButton, ListItemText, Typography } from '@mui/material'
import { PostVisibility } from '../post.types'
import { useState } from 'react'

interface Props {
  defaultValue: PostVisibility
  onChange: (value: PostVisibility) => void
  hasTripContext: boolean
}

const LABEL: Record<PostVisibility, { title: string; description: string }> = {
  [PostVisibility.PRIVATE]: { title: '나만 보기', description: '본인만 볼 수 있어요' },
  [PostVisibility.MEMBERS]: { title: '여행 멤버', description: '같이 다녀온 사람들에게만 공개' },
  [PostVisibility.PUBLIC]: { title: '전체 공개', description: '누구나 볼 수 있어요' },
}

export function PostVisibilityField({ defaultValue, onChange, hasTripContext }: Props) {
  const [value, setValue] = useState(defaultValue);
  return (
    <>
      <List disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {(Object.keys(LABEL) as PostVisibility[]).map((option) => {
          const disabled = option === PostVisibility.MEMBERS && !hasTripContext
          return (
            <ListItemButton
              key={option}
              disabled={disabled}
              selected={value === option}
              onClick={() => {
                onChange(option)
                setValue(option);
              }}
              sx={{ justifyContent: 'space-between' }}
            >
              <Typography variant="body2">
                {LABEL[option].title}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {LABEL[option].description}
              </Typography>

            </ListItemButton>
          )
        })}
      </List>
    </>
  )
}
