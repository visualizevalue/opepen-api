import { DateTime, Duration } from 'luxon'

export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const daysInSeconds = (days: number): number => days * 60 * 60 * 24

export const nowInSeconds = (): number => Math.floor(Date.now() / 1000)

export const asUTCDate = (date: Date|null) => date
  ? DateTime.utc(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  )
  : null

export const timeRemaining = (duration?: Duration) => {
  if (! duration) return `0h 0m 0s`

  const d = duration.shiftTo('days', 'hours', 'minutes', 'seconds')
  return [
    d.days ? `${d.days}d` : '',
    d.hours ? `${d.hours}h` : '',
    d.minutes ? `${d.minutes}m` : '',
    (!d.days && !d.hours && d.minutes < 10) ? `${d.seconds}s` : '',
  ].filter(t => !!t).join(' ')
}

export const timeRemainingFromSeconds = (seconds: number) => {
  return timeRemaining(Duration.fromObject({ seconds: seconds }))
}


export const BLOCKS_PER_DAY = 6200
export const BLOCKS_PER_WEEK = BLOCKS_PER_DAY * 7
export const BLOCKS_PER_2_WEEKS = BLOCKS_PER_WEEK * 2
