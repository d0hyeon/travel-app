import type { ValueOf } from "@waylog/utility";

export const IncheonAirportTerminalId = {
  "1터미널": "P01",
  "1터미널(탑승동)": "P02",
  "2터미널": "P03",
} as const;
export type IncheonAirportTerminalId = ValueOf<typeof IncheonAirportTerminalId>;
