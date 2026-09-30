import { useAuth } from "@waylog/domains/clients";
import { useBlockUser } from "@waylog/domains/modules/user-block";
import { toast } from "sonner";
import { usePost } from "./usePost";
import { useReportDialog } from "~features/report/useReportDialog";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { PopMenu } from "~shared/components/PopMenu";

type MenuProps = {
  postId: string;
  onDelete?: () => void;
  onBlock?: () => void;
}
export function PostMenu({ postId, onDelete, onBlock }: MenuProps) {
  const { data: { authorId }, remove } = usePost(postId);
  const { data: auth } = useAuth();
  const confirm = useConfirmDialog();
  const report = useReportDialog();
  const blockUser = useBlockUser();

  if (!auth) {
    return null;
  }

  if (authorId !== auth.id) {
    return (
      <PopMenu
        list={
          <PopMenu.List>
            <PopMenu.Item onClick={() => report({ targetType: 'post', targetId: postId })}>
              신고
            </PopMenu.Item>
            <PopMenu.Item
              color="error"
              onClick={async () => {
                if (await confirm('이 사용자를 차단할까요?\n이 사용자의 게시물이 더 이상 보이지 않아요.')) {
                  await blockUser(authorId);
                  toast.success('차단했어요');
                  onBlock?.();
                }
              }}
            >
              작성자 차단
            </PopMenu.Item>
          </PopMenu.List>
        }
      />
    )
  }

  return (
    <PopMenu
      list={
        <PopMenu.List>
          <PopMenu.Item
            color="error"
            onClick={async () => {
              if (await confirm('피드를 삭제하시겠어요?')) {
                remove();
                onDelete?.();
              }
            }}
          >
            삭제
          </PopMenu.Item>
        </PopMenu.List>
      }
    />
  )

}
