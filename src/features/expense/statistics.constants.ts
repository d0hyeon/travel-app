export type StatisticsTone = 'blue' | 'amber' | 'mint'

export const statisticsToneStyles = {
  blue: { bg: '#f4f8ff', border: '#d9e7ff', fill: '#4C84FF', soft: '#dfeaff' },
  amber: { bg: '#fff8ef', border: '#ffe2b8', fill: '#d68d06', soft: '#ffeacc' },
  mint: { bg: '#f2fbf7', border: '#cceede', fill: '#2a9d6f', soft: '#d9f5e9' },
} as const
