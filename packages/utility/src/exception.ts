export class ExceptionError extends Error {
  static name = "ExceptionError";
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }

  static isError(error: unknown): error is ExceptionError {
    return error instanceof ExceptionError;
  }
}

export function assert(
  value: boolean,
  fallback: string | Error = "Value is required",
): asserts value {
  if (value) return;
  throw typeof fallback === "string" ? new ExceptionError(fallback) : fallback;
}
