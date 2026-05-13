<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useProjects } from '../composables/useProjects'
import { useClients } from '../composables/useClients'

const { projects, load: loadProjects } = useProjects()
const { clients, load: loadClients } = useClients()

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const today = new Date()
today.setHours(0, 0, 0, 0)

const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedDate = ref(null)

const selectedProjectIds = ref(new Set())
const filterOpen = ref(false)

watch(projects, (list) => {
  selectedProjectIds.value = new Set(list.map(p => p.id))
}, { immediate: true })

function parseDate(s) {
  if (!s) return null
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return d
}

function ymd(d) {
  return d.toISOString().slice(0, 10)
}

function clientName(id) {
  return clients.value.find(c => c.id === id)?.name || '—'
}

const monthLabel = computed(() => `${MONTH_NAMES[viewMonth.value]} ${viewYear.value}`)

const grid = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const firstWeekday = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(1 - firstWeekday)

  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    d.setHours(0, 0, 0, 0)
    cells.push(d)
  }
  return cells
})

const visibleProjects = computed(() =>
  projects.value
    .filter(p => p.expected_end_date && selectedProjectIds.value.has(p.id))
    .map(p => ({
      ...p,
      end: parseDate(p.expected_end_date)
    }))
)

function dayInfo(d) {
  const time = d.getTime()
  const deadlines = visibleProjects.value.filter(p => p.end.getTime() === time)
  return { deadlines }
}

function isOtherMonth(d) {
  return d.getMonth() !== viewMonth.value
}

function isToday(d) {
  return d.getTime() === today.getTime()
}

function isSelected(d) {
  return selectedDate.value && d.getTime() === selectedDate.value.getTime()
}

function selectDay(d) {
  if (selectedDate.value && d.getTime() === selectedDate.value.getTime()) {
    selectedDate.value = null
  } else {
    selectedDate.value = new Date(d)
  }
}

function prevMonth() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value -= 1
  } else {
    viewMonth.value -= 1
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value += 1
  } else {
    viewMonth.value += 1
  }
}

function goToday() {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
  selectedDate.value = new Date(today)
}

function toggleProject(id) {
  const s = new Set(selectedProjectIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedProjectIds.value = s
}

function selectAllProjects() {
  selectedProjectIds.value = new Set(projects.value.map(p => p.id))
}

function clearAllProjects() {
  selectedProjectIds.value = new Set()
}

function closeFilter(e) {
  if (!filterOpen.value) return
  if (e.target.closest('.filter-pop')) return
  filterOpen.value = false
}

onMounted(() => {
  loadProjects()
  loadClients()
  window.addEventListener('click', closeFilter)
})
onBeforeUnmount(() => window.removeEventListener('click', closeFilter))

const monthDeadlines = computed(() => {
  const firstOfMonth = new Date(viewYear.value, viewMonth.value, 1)
  const lastOfMonth = new Date(viewYear.value, viewMonth.value + 1, 0)
  return visibleProjects.value
    .filter(p => p.end >= firstOfMonth && p.end <= lastOfMonth)
    .sort((a, b) => a.end - b.end)
})

const fmt = new Intl.NumberFormat('en-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
})

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long'
})

const shortDateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short'
})

const selectedDateLabel = computed(() =>
  selectedDate.value ? dateFmt.format(selectedDate.value) : ''
)
const selectedDateInfo = computed(() =>
  selectedDate.value ? dayInfo(selectedDate.value) : null
)
</script>

<template>
  <header class="view-head">
    <div>
      <div class="eyebrow">Schedule</div>
      <h2 class="view-title">{{ monthLabel }}</h2>
    </div>
    <div class="nav-controls">
      <div class="filter-pop">
        <button class="nav-btn filter-btn" @click.stop="filterOpen = !filterOpen">
          Filter · {{ selectedProjectIds.size }}/{{ projects.length }}
          <span class="caret">▾</span>
        </button>
        <div v-if="filterOpen" class="filter-panel" @click.stop>
          <div class="filter-head">
            <span>Show projects</span>
            <div class="filter-actions">
              <button @click="selectAllProjects">All</button>
              <button @click="clearAllProjects">None</button>
            </div>
          </div>
          <ul class="filter-list">
            <li v-for="p in projects" :key="p.id">
              <label>
                <input
                  type="checkbox"
                  :checked="selectedProjectIds.has(p.id)"
                  @change="toggleProject(p.id)"
                />
                <span class="dot" :class="`dot-${p.status}`"></span>
                <span class="filter-name">{{ p.name }}</span>
              </label>
            </li>
          </ul>
        </div>
      </div>
      <button class="nav-btn" @click="prevMonth" aria-label="Previous month">‹</button>
      <button class="nav-btn today-btn" @click="goToday">Today</button>
      <button class="nav-btn" @click="nextMonth" aria-label="Next month">›</button>
    </div>
  </header>

  <div class="legend">
    <span class="legend-item"><span class="legend-mark mark-deadline">⚑</span>Deadline</span>
  </div>

  <div class="cal-wrap">
    <div class="weekdays">
      <div v-for="d in DAY_NAMES" :key="d" class="weekday">{{ d }}</div>
    </div>
    <div class="grid">
      <div
        v-for="d in grid"
        :key="ymd(d)"
        class="cell"
        :class="{
          'other-month': isOtherMonth(d),
          today: isToday(d),
          selected: isSelected(d)
        }"
        @click="selectDay(d)"
      >
        <div class="cell-head">
          <span class="cell-num">{{ d.getDate() }}</span>
        </div>

        <div class="cell-events">
          <div
            v-for="p in dayInfo(d).deadlines.slice(0, 3)"
            :key="`d-${p.id}`"
            class="event deadline"
            :class="p.status"
            :title="`Deadline · ${p.name} · ${clientName(p.client_id)}`"
          >
            <span class="event-icon">⚑</span>
            <span class="event-name">{{ p.name }}</span>
          </div>
          <div v-if="dayInfo(d).deadlines.length > 3" class="more">
            +{{ dayInfo(d).deadlines.length - 3 }} more
          </div>
        </div>
      </div>
    </div>
  </div>

  <section class="below">
    <div v-if="selectedDate && selectedDateInfo" class="panel">
      <div class="panel-eyebrow">{{ selectedDateLabel }}</div>
      <div v-if="selectedDateInfo.deadlines.length" class="panel-group">
        <div class="panel-head deadline-head">Deadlines · {{ selectedDateInfo.deadlines.length }}</div>
        <ul class="panel-list">
          <li v-for="p in selectedDateInfo.deadlines" :key="`pd-${p.id}`">
            <span class="dot" :class="`dot-${p.status}`"></span>
            <div class="panel-name">
              {{ p.name }}
              <span class="panel-meta">{{ clientName(p.client_id) }} · {{ p.location }}</span>
            </div>
            <span class="panel-amt">{{ fmt.format(p.budget) }}</span>
          </li>
        </ul>
      </div>
      <p
        v-if="!selectedDateInfo.deadlines.length"
        class="panel-empty"
      >
        No deadlines on this day.
      </p>
    </div>
    <div v-else class="panel">
      <div class="panel-eyebrow">Deadlines this month · {{ monthDeadlines.length }}</div>
      <ul class="panel-list" v-if="monthDeadlines.length">
        <li v-for="p in monthDeadlines" :key="`md-${p.id}`">
          <span class="dot" :class="`dot-${p.status}`"></span>
          <div class="panel-name">
            {{ p.name }}
            <span class="panel-meta">{{ clientName(p.client_id) }} · due {{ shortDateFmt.format(p.end) }}</span>
          </div>
          <span class="panel-amt">{{ fmt.format(p.budget) }}</span>
        </li>
      </ul>
      <p v-else class="panel-empty">No deadlines this month.</p>
    </div>
  </section>
</template>

<style scoped>
.view-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 14px;
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--m-brass);
  margin-bottom: 6px;
}

.view-title {
  font-size: 32px;
  letter-spacing: 0.02em;
}

.nav-controls {
  display: flex;
  gap: 4px;
  align-items: center;
}

.nav-btn {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  padding: 7px 12px;
  font-size: 14px;
  color: var(--m-ink-2);
  min-width: 36px;
  transition: background 0.15s, color 0.15s;
}

.nav-btn:hover {
  background: var(--m-paper-2);
  color: var(--m-ink);
}

.today-btn {
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  min-width: 64px;
}

.filter-pop {
  position: relative;
  margin-right: 6px;
}

.filter-btn {
  font-size: 12px;
  letter-spacing: 0.04em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.caret {
  font-size: 9px;
  opacity: 0.6;
}

.filter-panel {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px rgba(42, 36, 29, 0.1);
  padding: 8px;
  min-width: 240px;
  max-height: 380px;
  display: flex;
  flex-direction: column;
  z-index: 30;
}

.filter-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px 8px;
  border-bottom: 0.5px solid var(--m-line-soft);
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--m-ink-3);
  text-transform: uppercase;
}

.filter-actions {
  display: flex;
  gap: 6px;
}

.filter-actions button {
  background: transparent;
  border: none;
  font-size: 11px;
  color: var(--m-brass);
  letter-spacing: 0.04em;
  padding: 2px 4px;
  text-transform: uppercase;
}

.filter-actions button:hover {
  color: var(--m-ink);
}

.filter-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  overflow-y: auto;
}

.filter-list li label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--m-ink);
}

.filter-list li label:hover {
  background: var(--m-paper-2);
}

.filter-list input[type="checkbox"] {
  margin: 0;
  accent-color: var(--m-ink);
}

.filter-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.legend {
  display: flex;
  gap: 18px;
  margin-bottom: 12px;
  font-size: 11px;
  color: var(--m-ink-3);
  letter-spacing: 0.04em;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  font-size: 10px;
}

.legend-mark.mark-deadline {
  background: var(--m-ink);
  color: var(--m-paper);
}

.cal-wrap {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 0.5px solid var(--m-line);
}

.weekday {
  padding: 10px 12px;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: var(--m-ink-3);
  text-transform: uppercase;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(108px, 1fr);
}

.cell {
  border-right: 0.5px solid var(--m-line-soft);
  border-bottom: 0.5px solid var(--m-line-soft);
  padding: 6px 7px 6px;
  cursor: pointer;
  transition: background 0.12s;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 4px;
}

.cell:nth-child(7n) {
  border-right: none;
}

.cell:nth-last-child(-n+7) {
  border-bottom: none;
}

.cell:hover {
  background: var(--m-paper-2);
}

.cell.other-month {
  background: rgba(0, 0, 0, 0.015);
}

.cell.other-month .cell-num {
  color: var(--m-ink-3);
  opacity: 0.55;
}

.cell.other-month .event {
  opacity: 0.4;
}

.cell.today .cell-num {
  background: var(--m-ink);
  color: var(--m-paper);
}

.cell.selected {
  box-shadow: inset 0 0 0 1.5px var(--m-brass);
}

.cell-head {
  display: flex;
  justify-content: flex-end;
}

.cell-num {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--m-ink-2);
  font-variant-numeric: tabular-nums;
  padding: 1px 6px;
  border-radius: 999px;
  min-width: 20px;
  text-align: center;
}

.cell-events {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-height: 0;
}

.event {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  line-height: 1.3;
  letter-spacing: 0.01em;
  min-width: 0;
}

.event-icon {
  font-size: 9px;
  flex-shrink: 0;
  line-height: 1;
}

.event-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event.deadline {
  font-weight: 500;
}

.event.deadline.new { background: var(--m-dot-new); color: var(--m-paper); }
.event.deadline.sales { background: var(--m-dot-sales); color: var(--m-paper); }
.event.deadline.ongoing { background: var(--m-dot-ongoing); color: var(--m-paper); }
.event.deadline.snagg { background: var(--m-dot-snagg); color: var(--m-paper); }

.more {
  font-size: 10px;
  color: var(--m-ink-3);
  padding-left: 4px;
}

.below {
  margin-top: 22px;
}

.panel {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius-lg);
  padding: 18px 22px;
}

.panel-eyebrow {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--m-ink-3);
  text-transform: uppercase;
  margin-bottom: 14px;
}

.panel-group {
  margin-bottom: 14px;
}

.panel-group:last-child {
  margin-bottom: 0;
}

.panel-head {
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--m-ink-3);
  margin-bottom: 6px;
}

.panel-head.deadline-head {
  color: var(--m-brass);
}

.panel-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.panel-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-top: 0.5px solid var(--m-line-soft);
}

.panel-list li:first-child {
  border-top: none;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-new { background: var(--m-dot-new); }
.dot-sales { background: var(--m-dot-sales); }
.dot-ongoing { background: var(--m-dot-ongoing); }
.dot-snagg { background: var(--m-dot-snagg); }

.panel-name {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  color: var(--m-ink);
  font-weight: 500;
  min-width: 0;
}

.panel-meta {
  font-size: 11px;
  color: var(--m-ink-3);
  font-weight: 400;
  letter-spacing: 0.02em;
  margin-top: 2px;
}

.panel-amt {
  font-size: 13px;
  color: var(--m-ink);
  font-variant-numeric: tabular-nums;
}

.panel-empty {
  margin: 0;
  font-size: 13px;
  color: var(--m-ink-3);
  font-style: italic;
}
</style>
