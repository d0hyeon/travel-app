import { useBlockedUsers, useBlockUser, useUnblockUser } from '@waylog/domains/modules/user-block'
import { useConfirmDialog } from '../../shared/components/confirm-dialog/useConfirmDialog'
import { PopMenu } from '../../shared/components/PopMenu'
import { useReportSheet } from '../report/useReportSheet'
import { toast } from 'sonner-native'

export function UserProfileMenu({ userId }: { userId: string }) {
  const { data: blockedUsers } = useBlockedUsers()
  const confirm = useConfirmDialog()
  const openReportSheet = useReportSheet()
  const blockUser = useBlockUser()
  const unblockUser = useUnblockUser()
  const isBlocked = blockedUsers.some((blockedUser) => blockedUser.id === userId)

  return (
    <PopMenu
      items={
        <>
          <PopMenu.Item onPress={() => openReportSheet({ targetType: 'user', targetId: userId })}>
            신고
          </PopMenu.Item>
          {isBlocked ? (
            <PopMenu.Item
              onPress={async () => {
                await unblockUser(userId)
              }}
            >
              차단 해제
            </PopMenu.Item>
          ) : (
            <PopMenu.Item
              color="error"
              onPress={async () => {
                if (await confirm('이 사용자를 차단할까요?')) {
                  await blockUser(userId);
                  toast.success('사용자를 차단했어요')
                }
              }}
            >
              차단
            </PopMenu.Item>
          )}
        </>
      }
    />
  )
}
