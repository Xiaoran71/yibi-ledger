import { describe, expect, it } from 'vitest'
import { formatMoney, localDateKey, parseAmount, sanitizeAmountInput } from './utils'

describe('money helpers', () => {
  it('stores decimal amounts as integer cents', () => {
    expect(parseAmount('28.50')).toBe(2850)
    expect(parseAmount('0.09')).toBe(9)
    expect(parseAmount('1,5')).toBe(150)
  })

  it('sanitizes mobile decimal input', () => {
    expect(sanitizeAmountInput('0012.345')).toBe('12.34')
    expect(sanitizeAmountInput('12..3')).toBe('12.3')
  })

  it('formats negative balances visibly', () => {
    expect(formatMoney(-2850)).toBe('−¥28.50')
  })
})

describe('date helpers', () => {
  it('builds a local calendar key', () => {
    expect(localDateKey(new Date(2026, 7, 21, 23, 30).getTime())).toBe('2026-08-21')
  })
})
