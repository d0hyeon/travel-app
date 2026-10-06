import { useAuth } from "../../gateways/auth";
import type { TripPermission } from "./tripPermission.types";
import { getTripRole, hasTripPermission } from "./tripPermission.utils";
import { useTripMembers } from "./useTripMembers";

export function useTripPermission(
  tripId: string,
  question: TripPermission,
): boolean;
export function useTripPermission<
  const Permissions extends readonly TripPermission[],
>(tripId: string, questions: Permissions): Record<Permissions[number], boolean>;
export function useTripPermission(
  tripId: string,
  question: TripPermission | readonly TripPermission[],
) {
  const { data: auth } = useAuth();
  const { data: role } = useTripMembers(tripId, {
    select: (members) => getTripRole(members, auth.id),
  });

  const isGranted = (permission: TripPermission) =>
    role != null && hasTripPermission(role, permission);

  if (typeof question === "string") return isGranted(question);
  return Object.fromEntries(
    question.map((permission) => [permission, isGranted(permission)]),
  );
}
