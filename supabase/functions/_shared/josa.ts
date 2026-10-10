// 원본: packages/utility/src/josa.ts
import { josa as hangulJosa, numberToHangul } from 'npm:es-hangul@2'

type JosaOption = Parameters<typeof hangulJosa>[1]

const TRAILING_DIGITS = /\d+$/

function toSpokenEnding(word: string): string {
  const trailingDigits = TRAILING_DIGITS.exec(word)?.[0]
  if (trailingDigits == null) return word

  return numberToHangul(Number(trailingDigits))
}

function pickJosa(word: string, option: JosaOption): string {
  return hangulJosa.pick(toSpokenEnding(word), option)
}

export function josa(word: string, option: JosaOption): string {
  return `${word}${pickJosa(word, option)}`
}

josa.pick = pickJosa
