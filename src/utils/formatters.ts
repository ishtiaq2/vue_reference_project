export function formatDateTime(date: Date, locale = 'en-GB'): string {
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'medium' }).format(date)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}
