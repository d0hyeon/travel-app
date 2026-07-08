import { Container } from "@mui/material";
import { generatePath } from "react-router";
import { AppRoute } from "~app/routes";
import { FullScreenPopup } from "~shared/components/FullScreenPopup";
import { TopNavigation } from "~shared/components/layout/TopNavigation.mobile";
import { useRouteOverlay } from "~shared/hooks/extends/route-overlay/useRouteOverlay";
import { PostScreen } from "./PostScreen";
import { PostMenu } from "./PostMenu";

export function usePostOverlay() {
  const { Link: Trigger, ...overlay } = useRouteOverlay(
    (postId: string) => generatePath(AppRoute.포스트_상세, { postId }),
    ({ isOpen, close, onClose, data: postId }) => (
      <FullScreenPopup isOpen={isOpen} onClose={onClose}>
        <TopNavigation
          leftElement={<TopNavigation.BackButton onClick={close} />}
          rightElement={<PostMenu postId={postId} onDelete={close} />}
          sx={{ position: 'sticky', borderBottom: 'none', bgcolor: 'transparent' }}
        />
        <Container maxWidth="sm" disableGutters sx={{ flex: 1 }}>
          <PostScreen postId={postId} />
        </Container>
      </FullScreenPopup>
    )
  )

  return { Trigger, ...overlay };
}