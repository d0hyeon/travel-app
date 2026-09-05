import { useAuth } from '@waylog/domains/clients'
import { usePost } from '@waylog/domains/modules/post'
import { useConfirmDialog } from '../../shared/components/confirm-dialog/useConfirmDialog'
import { PopMenu } from '../../shared/components/PopMenu'

interface Props {
  postId: string
  onDelete?: () => void
}

export function PostMenu({ postId, onDelete }: Props) {
  const { data: { authorId }, remove } = usePost(postId)
  const { data: auth } = useAuth()
  const confirm = useConfirmDialog()

  if (authorId !== auth?.id) {
    return null
  }

  return (
    <PopMenu
      items={
        <PopMenu.Item
          color="error"
          onClick={async () => {
            if (await confirm('피드를 삭제하시겠어요?')) {
              await remove()
              onDelete?.()
            }
          }}
        >
          삭제
        </PopMenu.Item>
      }
    />
  )
}
