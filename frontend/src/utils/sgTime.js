const SG_TIME_ZONE = 'Asia/Singapore'

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function sgNow() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: SG_TIME_ZONE }))
}

export function formatYmd(dateObj) {
  return `${dateObj.getFullYear()}-${pad2(dateObj.getMonth() + 1)}-${pad2(dateObj.getDate())}`
}

export function sgTodayStr() {
  return formatYmd(sgNow())
}

export function sgStartOfWeekStr() {
  const today = sgNow()
  today.setDate(today.getDate() - today.getDay())
  return formatYmd(today)
}

export function sgEndOfWeekStr() {
  const today = sgNow()
  today.setDate(today.getDate() + (6 - today.getDay()))
  return formatYmd(today)
}

export function sgStartOfMonthStr() {
  const today = sgNow()
  return `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-01`
}

export function sgEndOfMonthStr() {
  const today = sgNow()
  const year = today.getFullYear()
  const monthIndex = today.getMonth()
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  return `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`
}

export function sgDateFromYmd(dateStr) {
  return new Date(`${dateStr}T00:00:00+08:00`)
}

export function sgDateTimeFrom(dateStr, timeStr) {
  const baseDate = dateStr || sgTodayStr()
  let hours = 0
  let minutes = 0

  const raw = (timeStr || '').trim()
  if (raw) {
    const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
    if (match) {
      hours = Number(match[1])
      minutes = Number(match[2])
      const meridiem = (match[3] || '').toUpperCase()
      if (meridiem === 'PM' && hours !== 12) hours += 12
      if (meridiem === 'AM' && hours === 12) hours = 0
    } else {
      const [h, m] = raw.split(':').map(Number)
      hours = Number.isFinite(h) ? h : 0
      minutes = Number.isFinite(m) ? m : 0
    }
  }

  const [year, month, day] = baseDate.split('-').map(Number)
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, hours - 8, minutes, 0, 0))
}

export function sgHourNow() {
  return sgNow().getHours()
}

export function sgLocaleDate(dateValue, locale = 'en-US', options = {}) {
  if (!dateValue) return ''
  return new Date(dateValue).toLocaleDateString(locale, {
    timeZone: SG_TIME_ZONE,
    ...options,
  })
}
