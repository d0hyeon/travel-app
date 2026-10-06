import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
  type Query,
} from "@tanstack/react-query";
import { useAuth } from "../../gateways/auth";
import { postDetailKey } from "../post";
import {
  blockUser,
  getBlockedUsers,
  unblockUser,
  userBlockKey,
} from "./userBlock.api";

export function useBlockedUsers() {
  const { data: auth } = useAuth({ required: false });

  return useSuspenseQuery({
    queryKey: [userBlockKey, auth?.id],
    queryFn: getBlockedUsers,
  });
}

const isPostDetailQuery = ({ queryKey }: Query) =>
  queryKey[0] === postDetailKey;

function useRefreshAfterBlockChange() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      predicate: (query) => !isPostDetailQuery(query),
      refetchType: "all",
    });
    void queryClient.invalidateQueries({
      predicate: isPostDetailQuery,
      refetchType: "none",
    });
  };
}

export function useBlockUser() {
  const refresh = useRefreshAfterBlockChange();
  const mutation = useMutation({ mutationFn: blockUser, onSuccess: refresh });

  return Object.assign(mutation.mutateAsync, mutation);
}

export function useUnblockUser() {
  const refresh = useRefreshAfterBlockChange();
  const mutation = useMutation({ mutationFn: unblockUser, onSuccess: refresh });

  return Object.assign(mutation.mutateAsync, mutation);
}
