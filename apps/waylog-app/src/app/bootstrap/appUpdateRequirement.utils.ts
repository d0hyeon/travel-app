export function isVersionBelow(version: string, minimumVersion: string): boolean {
  const current = parseVersion(version)
  const minimum = parseVersion(minimumVersion)
  if (current == null || minimum == null) return false

  const length = Math.max(current.length, minimum.length)
  for (let index = 0; index < length; index++) {
    const difference = (current[index] ?? 0) - (minimum[index] ?? 0)
    if (difference !== 0) return difference < 0
  }
  return false
}

function parseVersion(version: string): number[] | null {
  if (!/^\d+(\.\d+)*$/.test(version)) return null
  return version.split('.').map(Number)
}
