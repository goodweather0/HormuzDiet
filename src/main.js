import './style.css';
import { buildMonthOptions, createMonthGrid, findDefaultMonth, formatMonthLabel } from './calendar.js';
import zhCN from '../i18n/zh-CN.json';
import enUS from '../i18n/en-US.json';

const DEFAULT_LOCALE = 'zh-CN';

const LOCALES = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

const STATUS_STYLES = {
  war: {
    badgeClass: 'badge badge-war',
    cellClass: 'day-card is-war',
    dotClass: 'status-dot status-dot-war',
  },
  ceasefire: {
    badgeClass: 'badge badge-ceasefire',
    cellClass: 'day-card is-ceasefire',
    dotClass: 'status-dot status-dot-ceasefire',
  },
};

const LEGACY_STATUS_MAP = {
  clash: 'war',
  talks: 'ceasefire',
  ceasefire: 'ceasefire',
  war: 'war',
};

const monthOptions = buildMonthOptions();
const state = {
  selectedMonthKey: findDefaultMonth(monthOptions),
  events: [],
  dataLoadError: false,
  locale: DEFAULT_LOCALE,
};

const app = document.querySelector('#app');
const descriptionMeta = document.querySelector('meta[name="description"]');

let elements = {};

function getDictionary() {
  return LOCALES[state.locale] || LOCALES[DEFAULT_LOCALE];
}

function getStatusMeta(status) {
  const dictionary = getDictionary();
  return {
    ...STATUS_STYLES[status],
    label: dictionary.statusLabels[status],
    diet: dictionary.dietLabels[status],
  };
}

function normalizeEvents(rawEvents) {
  return rawEvents
    .filter((item) => item && typeof item.date === 'string' && LEGACY_STATUS_MAP[item.status])
    .map((item) => ({
      date: item.date,
      status: LEGACY_STATUS_MAP[item.status],
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function groupEventsByDate(events) {
  return events.reduce((map, event) => {
    map.set(event.date, event);
    return map;
  }, new Map());
}

function renderAppShell() {
  const dictionary = getDictionary();

  document.documentElement.lang = dictionary.htmlLang;
  document.title = dictionary.title;

  if (descriptionMeta) {
    descriptionMeta.setAttribute('content', dictionary.description);
  }

  app.innerHTML = `
    <main class="page-shell">
      <section class="hero-card hero-card-compact">
        <div class="hero-topline">
          <p class="eyebrow">${dictionary.eyebrow}</p>
          <div class="language-switch" role="group" aria-label="${dictionary.languageAria}">
            <button class="language-button ${state.locale === 'zh-CN' ? 'is-active' : ''}" data-locale="zh-CN" type="button">${dictionary.languages['zh-CN']}</button>
            <button class="language-button ${state.locale === 'en-US' ? 'is-active' : ''}" data-locale="en-US" type="button">${dictionary.languages['en-US']}</button>
          </div>
        </div>
        <h1>${dictionary.title}</h1>
      </section>

      <section class="panel panel-calendar">
        <div class="panel-topline panel-topline-centered">
          <div>
            <p class="section-kicker">${dictionary.calendarLabel}</p>
            <h2 id="month-heading">-</h2>
          </div>
          <div class="calendar-controls">
            <button id="prev-month" class="nav-button" type="button" aria-label="${dictionary.aria.prevMonth}">‹</button>
            <select id="month-select" aria-label="${dictionary.aria.selectMonth}"></select>
            <button id="next-month" class="nav-button" type="button" aria-label="${dictionary.aria.nextMonth}">›</button>
          </div>
        </div>

        <div class="legend-row legend-row-centered">
          <span class="badge badge-war">${dictionary.statusLabels.war}: ${dictionary.dietLabels.war}</span>
          <span class="badge badge-ceasefire">${dictionary.statusLabels.ceasefire}: ${dictionary.dietLabels.ceasefire}</span>
        </div>

        <div class="weekday-row" id="weekday-row"></div>
        <div class="calendar-grid" id="calendar-grid"></div>
      </section>
    </main>
  `;

  elements = {
    monthHeading: document.querySelector('#month-heading'),
    monthSelect: document.querySelector('#month-select'),
    prevButton: document.querySelector('#prev-month'),
    nextButton: document.querySelector('#next-month'),
    weekdayRow: document.querySelector('#weekday-row'),
    calendarGrid: document.querySelector('#calendar-grid'),
    languageButtons: Array.from(document.querySelectorAll('[data-locale]')),
  };

  bindEvents();
  renderMonthOptions();
  renderWeekdays();
  renderCalendar();
}

function bindEvents() {
  elements.monthSelect.addEventListener('change', (event) => {
    state.selectedMonthKey = event.target.value;
    renderCalendar();
  });

  elements.prevButton.addEventListener('click', () => changeMonth(-1));
  elements.nextButton.addEventListener('click', () => changeMonth(1));

  elements.languageButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const nextLocale = button.dataset.locale;

      if (!LOCALES[nextLocale] || nextLocale === state.locale) {
        return;
      }

      state.locale = nextLocale;
      renderAppShell();
    });
  });
}

function renderMonthOptions() {
  elements.monthSelect.innerHTML = monthOptions
    .map((item) => {
      const label = formatMonthLabel(item.year, item.month, state.locale);
      return `<option value="${item.key}" ${item.key === state.selectedMonthKey ? 'selected' : ''}>${label}</option>`;
    })
    .join('');
}

function renderWeekdays() {
  const dictionary = getDictionary();
  elements.weekdayRow.innerHTML = dictionary.weekdays.map((label) => `<div>${label}</div>`).join('');
}

function getDayCardState(dateKey, todayKey) {
  const classes = [];

  if (dateKey === todayKey) {
    classes.push('is-today');
  }

  if (dateKey > todayKey) {
    classes.push('is-future');
  }

  return classes.join(' ');
}

function renderCalendar() {
  const [selectedYear, selectedMonth] = state.selectedMonthKey.split('-').map(Number);
  const monthIndex = selectedMonth - 1;
  const selectedOption = monthOptions.find((item) => item.key === state.selectedMonthKey);
  const eventsByDate = groupEventsByDate(state.events);
  const todayKey = new Date().toISOString().slice(0, 10);
  const dictionary = getDictionary();

  elements.monthHeading.textContent = formatMonthLabel(selectedOption.year, selectedOption.month, state.locale);

  if (state.dataLoadError) {
    elements.calendarGrid.innerHTML = `<div class="empty-state empty-state-calendar">${dictionary.errors.loadData}</div>`;
    return;
  }

  elements.calendarGrid.innerHTML = createMonthGrid(selectedYear, monthIndex)
    .map((cell) => {
      if (cell.isPadding) {
        return '<div class="day-card is-padding" aria-hidden="true"></div>';
      }

      const event = eventsByDate.get(cell.dateKey);

      if (!event) {
        return `
          <article class="day-card ${getDayCardState(cell.dateKey, todayKey)}">
            <span class="day-number">${cell.day}</span>
          </article>
        `;
      }

      const meta = getStatusMeta(event.status);
      return `
        <article class="${meta.cellClass} ${getDayCardState(cell.dateKey, todayKey)}">
          <span class="day-number">${cell.day}</span>
          <div class="day-status">
            <span class="${meta.dotClass}" aria-hidden="true"></span>
            <span class="${meta.badgeClass}">${meta.label}</span>
          </div>
        </article>
      `;
    })
    .join('');

  const selectedIndex = monthOptions.findIndex((item) => item.key === state.selectedMonthKey);
  elements.prevButton.disabled = selectedIndex <= 0;
  elements.nextButton.disabled = selectedIndex >= monthOptions.length - 1;
}

function changeMonth(step) {
  const currentIndex = monthOptions.findIndex((item) => item.key === state.selectedMonthKey);
  const nextIndex = currentIndex + step;

  if (nextIndex < 0 || nextIndex >= monthOptions.length) {
    return;
  }

  state.selectedMonthKey = monthOptions[nextIndex].key;
  elements.monthSelect.value = state.selectedMonthKey;
  renderCalendar();
}

async function loadEvents() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/war-days.json`);

  if (!response.ok) {
    throw new Error('Unable to load war-days.json');
  }

  const payload = await response.json();
  state.events = normalizeEvents(Array.isArray(payload.events) ? payload.events : []);
}

renderAppShell();

loadEvents()
  .catch(() => {
    state.dataLoadError = true;
  })
  .finally(() => {
    renderCalendar();
  });
