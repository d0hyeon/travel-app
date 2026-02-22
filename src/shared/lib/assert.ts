export function assert(
  value: boolean,
  message = 'Value is required'
): asserts value {
  if (value == null) {
    throw new Error(message)
  }
}
