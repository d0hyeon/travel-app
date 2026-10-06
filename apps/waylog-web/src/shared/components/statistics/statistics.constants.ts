export type StatisticsTone = 'blue' | 'amber' | 'mint'

export const statisticsToneStyles = {
  blue: { bg: '#fff', border: '#e6e6e6', fill: '#4C84FF', soft: '#dfeaff' },
  amber: { bg: '#fff', border: '#e6e6e6', fill: '#d68d06', soft: '#ffeacc' },
  mint: { bg: '#fff', border: '#e6e6e6', fill: '#2a9d6f', soft: '#d9f5e9' },
} as const
