export function isFlightStatusNotificationData(
  data: unknown,
): data is { tripId: string; transportId: string } {
  return hasExactStringFields(data, ["tripId", "transportId"]);
}

function hasExactStringFields(
  data: unknown,
  fieldNames: readonly string[],
): data is Record<string, string> {
  if (data == null || typeof data !== "object") return false;

  const fields = Object.entries(data);
  return (
    fields.length === fieldNames.length &&
    fields.every(
      ([fieldName, value]) =>
        fieldNames.includes(fieldName) && typeof value === "string",
    )
  );
}
