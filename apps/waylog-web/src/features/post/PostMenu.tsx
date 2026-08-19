import { useAuth } from "@waylog/domains/auth";
import { usePost } from "./usePost";
import { useConfirmDialog } from "~shared/components/confirm-dialog/useConfirmDialog";
import { PopMenu } from "~shared/components/PopMenu";

type MenuProps = {
  postId: string;
  onDelete?: () => void;
}
export function PostMenu({ postId, onDelete }: MenuProps) {
  const { data: { authorId }, remove } = usePost(postId);
  const { data: auth } = useAuth();
  const confirm = useConfirmDialog();

  if (authorId !== auth?.id) {
    return null;
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
