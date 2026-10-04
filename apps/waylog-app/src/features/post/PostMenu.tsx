import { useAuth } from '@waylog/domains/clients'
import { usePost } from '@waylog/domains/modules/post'
import { useBlockUser } from '@waylog/domains/modules/user-block'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { PopMenu } from '~shared/components/PopMenu'
import { useReportSheet } from '~features/report/useReportSheet'

interface Props {
  postId: string
  onDelete?: () => void
  onBlock?: () => void
}

export function PostMenu({ postId, onDelete, onBlock }: Props) {
  const { data: { authorId }, remove } = usePost(postId)
  const { data: auth } = useAuth()
  const confirm = useConfirmDialog()
  const openReportSheet = useReportSheet()
  const blockUser = useBlockUser()

  if (auth == null) {
    return null
  }

  if (authorId !== auth.id) {
    return (
      <PopMenu
        items={
          <>
            <PopMenu.Item onPress={() => openReportSheet({ targetType: 'post', targetId: postId })}>
              신고
            </PopMenu.Item>
            <PopMenu.Item
              color="error"
              onPress={async () => {
                if (await confirm('이 사용자를 차단할까요?')) {
                  await blockUser(authorId)
                  onBlock?.()
                }
              }}
            >
              작성자 차단
            </PopMenu.Item>
          </>
        }
      />
    )
  }

  return (
    <PopMenu
      items={
        <PopMenu.Item
          color="error"
          onPress={async () => {
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
