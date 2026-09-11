import { describe, expect, it } from 'vitest'
import { addDays, addWeeks, formatDateKey, getWeekDates, getWeekStart } from './weekDates'

describe('getWeekStart', () => {
  it('returns the same date when given a Monday', () => {
    expect(formatDateKey(getWeekStart(new Date(2026, 8, 7)))).toBe('2026-09-07')
  })

  it('rolls back to Monday when given a mid-week date', () => {
    expect(formatDateKey(getWeekStart(new Date(2026, 8, 11)))).toBe('2026-09-07')
  })

  it('rolls back to Monday when given a Sunday', () => {
    expect(formatDateKey(getWeekStart(new Date(2026, 8, 13)))).toBe('2026-09-07')
  })
})

describe('getWeekDates', () => {
  it('returns 7 consecutive dates starting from the week start', () => {
    const dates = getWeekDates(new Date(2026, 8, 7))
    expect(dates).toHaveLength(7)
    expect(dates.map(formatDateKey)).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
      '2026-09-12',
      '2026-09-13',
    ])
  })
})

describe('addWeeks', () => {
  it('advances by 7 days per week', () => {
    expect(formatDateKey(addWeeks(new Date(2026, 8, 7), 1))).toBe('2026-09-14')
    expect(formatDateKey(addWeeks(new Date(2026, 8, 7), -1))).toBe('2026-08-31')
  })
})

describe('addDays', () => {
  it('crosses month boundaries correctly', () => {
    expect(formatDateKey(addDays(new Date(2026, 8, 30), 1))).toBe('2026-10-01')
  })
})
