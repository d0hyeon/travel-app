import { ExceptionError } from "@waylog/utility";

export function assert(
  value: boolean,
  fallback: string | Error = "value is falsy",
): asserts value {
  if (value) return;
  throw typeof fallback === "string"
    ? new ExceptionError(`${ExceptionError.name}:${fallback}`)
    : fallback;
}
