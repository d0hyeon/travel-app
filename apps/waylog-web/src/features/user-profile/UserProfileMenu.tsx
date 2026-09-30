import { useBlockedUsers, useBlockUser, useUnblockUser } from '@waylog/domains/modules/user-block'
import { toast } from 'sonner'
import { useReportDialog } from '~features/report/useReportDialog'
import { useConfirmDialog } from '~shared/components/confirm-dialog/useConfirmDialog'
import { PopMenu } from '~shared/components/PopMenu'

interface Props {
  userId: string
}

export function UserProfileMenu({ userId }: Props) {
  const { data: blockedUsers } = useBlockedUsers()
  const confirm = useConfirmDialog()
  const report = useReportDialog()
  const blockUser = useBlockUser()
  const unblockUser = useUnblockUser()

  const isBlocked = blockedUsers.some((blockedUser) => blockedUser.id === userId)

  return (
    <PopMenu
      list={
        <PopMenu.List>
          <PopMenu.Item onClick={() => report({ targetType: 'user', targetId: userId })}>
            신고
          </PopMenu.Item>
          {isBlocked ? (
            <PopMenu.Item
              onClick={async () => {
                await unblockUser(userId)
                toast.success('차단을 해제했어요')
              }}
            >
              차단 해제
            </PopMenu.Item>
          ) : (
            <PopMenu.Item
              color="error"
              onClick={async () => {
                if (await confirm('이 사용자를 차단할까요?\n이 사용자의 게시물이 더 이상 보이지 않아요.')) {
                  await blockUser(userId)
                  toast.success('차단했어요')
                }
              }}
            >
              차단
            </PopMenu.Item>
          )}
        </PopMenu.List>
      }
    />
  )
}
