// Hermes 는 ES2023 배열 메서드를 아직 제공하지 않는다.
// 공유 코드(@waylog/domains)가 웹 기준으로 쓰고 있으므로 앱에서 채운다.
if (Array.prototype.toSorted == null) {
  Object.defineProperty(Array.prototype, 'toSorted', {
    value: function <T>(this: T[], compare?: (a: T, b: T) => number): T[] {
      return [...this].sort(compare)
    },
    writable: true,
    configurable: true,
  })
}

if (Array.prototype.toReversed == null) {
  Object.defineProperty(Array.prototype, 'toReversed', {
    value: function <T>(this: T[]): T[] {
      return [...this].reverse()
    },
    writable: true,
    configurable: true,
  })
}

if (Array.prototype.toSpliced == null) {
  Object.defineProperty(Array.prototype, 'toSpliced', {
    value: function <T>(this: T[], start: number, deleteCount?: number, ...items: T[]): T[] {
      const copy = [...this]
      copy.splice(start, deleteCount as number, ...items)
      return copy
    },
    writable: true,
    configurable: true,
  })
}

export {}
