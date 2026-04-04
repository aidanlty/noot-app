const SG_TIME_ZONE = 'Asia/Singapore'

function getSgTodayStr() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SG_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function sgDateFromYmd(dateStr) {
  if (!dateStr) return null
  return new Date(`${dateStr}T00:00:00+08:00`)
}

function sgStartOfToday() {
  return sgDateFromYmd(getSgTodayStr())
}

module.exports = {
  getSgTodayStr,
  sgDateFromYmd,
  sgStartOfToday,
}
