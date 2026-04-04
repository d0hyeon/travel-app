export function getItem<T>(key: string): T[] {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

export function setItem<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function generateId(): string {
  return crypto.randomUUID()
}
