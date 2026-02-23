export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function formatDateISO(value: string | number | Date) {
  return new Date(value).toISOString().split('T')[0]
}