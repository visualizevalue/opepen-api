import { DateTime } from 'luxon'

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
