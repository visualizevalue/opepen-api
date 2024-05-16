import { DateTime, Duration, DurationLikeObject } from 'luxon'

export const formatDate = (date: DateTime) => {
  return date
    .setLocale('en')
    .toLocaleString(DateTime.DATE_MED)
}

export const formatDateTime = (date: DateTime) => {
  return date.toLocaleString({ year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })
}

export const formatTime = (date: DateTime) => {
  return date.toLocaleString({ hour: 'numeric', minute: 'numeric' })
}

export const formatDuration = (dur: Duration, shift: (keyof DurationLikeObject)[] = ['days', 'hours']) => {
  const obj = dur?.shiftTo(...shift).toObject() || {}

  return [
    obj.years && `${obj.years}y`,
    obj.weeks && `${obj.weeks}w`,
    obj.days && `${Math.floor(obj.days)}d`,
    obj.hours && `${Math.floor(obj.hours)}h`,
  ].filter(t => !!t).join(' ') || '0h'
}
