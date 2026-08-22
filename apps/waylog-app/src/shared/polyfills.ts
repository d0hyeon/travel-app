import * as ExpoCrypto from 'expo-crypto'

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

// Hermes 에는 crypto 전역이 없다.
// 초대 링크(share_link)처럼 추측되면 안 되는 값에 쓰이므로
// Math.random 이 아니라 네이티브 보안 난수를 쓰는 expo-crypto 로 채운다.
const globalScope = globalThis as { crypto?: Partial<Crypto> }

if (globalScope.crypto == null) {
  globalScope.crypto = {}
}

if (globalScope.crypto.randomUUID == null) {
  // expo-crypto 는 string 을 주지만 값은 RFC4122 v4 형식이다.
  // 표준 시그니처가 요구하는 템플릿 리터럴 타입으로 좁힌다.
  globalScope.crypto.randomUUID = ExpoCrypto.randomUUID as Crypto['randomUUID']
}

if (globalScope.crypto.getRandomValues == null) {
  globalScope.crypto.getRandomValues = ExpoCrypto.getRandomValues as Crypto['getRandomValues']
}

export {}
