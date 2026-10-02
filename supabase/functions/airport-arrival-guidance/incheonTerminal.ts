export type IncheonTerminalCode = 'T1' | 'T2'

const INCHEON_AIRPORT_CODE = 'ICN'

const CODE_BY_TERMINAL_ID = new Map<string, IncheonTerminalCode>([
  ['P01', 'T1'],
  ['P02', 'T1'],
  ['P03', 'T2'],
])

export function toIncheonTerminalCode(terminalId: string | null): IncheonTerminalCode | null {
  if (terminalId == null) return null

  return CODE_BY_TERMINAL_ID.get(terminalId) ?? null
}

export interface GuidanceTerminal {
  snapshotTerminal: string
  responseTerminal: string
}

export function getGuidanceTerminal(input: {
  isOverseas: boolean
  departureAirportCode: string
  flightStatusTerminal: string | null
  ticketTerminal: string | null
}): GuidanceTerminal | null {
  if (!input.isOverseas) {
    if (input.ticketTerminal == null) return null

    return { snapshotTerminal: input.ticketTerminal, responseTerminal: input.ticketTerminal }
  }

  if (input.departureAirportCode !== INCHEON_AIRPORT_CODE) return null
  if (input.flightStatusTerminal == null) return null

  const terminalCode = toIncheonTerminalCode(input.flightStatusTerminal)
  if (terminalCode == null) return null

  return { snapshotTerminal: terminalCode, responseTerminal: input.flightStatusTerminal }
}
