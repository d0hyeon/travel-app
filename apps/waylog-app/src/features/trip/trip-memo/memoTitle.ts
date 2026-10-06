const DEFAULT_MEMO_TITLE = '메모'

export function getMemoDisplayTitle(
  title: string | null | undefined,
  content: string,
  maxLength?: number,
): string {
  const trimmedTitle = title?.trim()
  if (trimmedTitle) return trimmedTitle

  const contentPreview = maxLength == null ? content.trim() : content.trim().substring(0, maxLength)
  return contentPreview || DEFAULT_MEMO_TITLE
}
