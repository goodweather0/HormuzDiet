const START_YEAR = 2026;
const END_YEAR = 2030;

export function buildMonthOptions() {
  const options = [];

  for (let year = START_YEAR; year <= END_YEAR; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      options.push({
        key: formatMonthKey(year, month),
        year,
        month,
      });
    }
  }

  return options;
}

export function createMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const cells = [];

  for (let index = 0; index < offset; index += 1) {
    cells.push({ isPadding: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      isPadding: false,
      day,
      dateKey: formatDateKey(year, month, day),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ isPadding: true });
  }

  return cells;
}

export function formatMonthLabel(year, month, locale) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(year, month, 1));
}

export function formatMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function formatDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function findDefaultMonth(monthOptions) {
  const today = new Date();
  const currentKey = formatMonthKey(today.getFullYear(), today.getMonth());
  const match = monthOptions.find((item) => item.key === currentKey);

  if (match) {
    return match.key;
  }

  const first = monthOptions[0];
  const last = monthOptions[monthOptions.length - 1];
  return today < new Date(START_YEAR, 0, 1) ? first.key : last.key;
}
