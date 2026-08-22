import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { getTripByShareLink } from "@waylog/domains/modules/trip";
import { joinTrip } from "@waylog/domains/modules/trip-member";
import type { ValueOf } from "@waylog/utility";

interface UseInvitedTripParams {
  sharedLink: string;
}

const ErrorTypes = {
  잘못된_링크: 'InvalidLink',
  만료된_링크: 'ExpiredLink',
} as const;
type ErrorType = ValueOf<typeof ErrorTypes>;
const ERROR_MESSAGE = {
  [ErrorTypes.만료된_링크]: '만료된 초대입니다.',
  [ErrorTypes.잘못된_링크]: '유효하지 않은 초대입니다.'
} satisfies Record<ErrorType, string>;

export function useInvitedTrip({ sharedLink }: UseInvitedTripParams) {
  const { data, ...queries } = useSuspenseQuery({
    queryKey: useInvitedTrip.key(sharedLink),
    queryFn: async () => {
      const trip = await getTripByShareLink(sharedLink).catch(() => {
        throw new Error(ERROR_MESSAGE[ErrorTypes.잘못된_링크], { cause: ErrorTypes.잘못된_링크 })
      });
      if (trip == null) {
        throw new Error(ERROR_MESSAGE[ErrorTypes.만료된_링크], { cause: ErrorTypes.만료된_링크 })
      }
      return trip;
    },
  });

  const { mutateAsync, ...mutation } = useMutation({
    mutationFn: () => joinTrip(data.id),
  });

  return {
    data,
    join: Object.assign(mutateAsync, mutation),
    ...queries
  }
}

useInvitedTrip.key = (sharedLink: string) => {
  return ['invited-trip', sharedLink]
}
