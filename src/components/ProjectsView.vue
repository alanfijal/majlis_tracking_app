<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { projects, clients, statusOptions } from '../data.js'

defineEmits(['new-project'])

const currentFilter = ref('all')
const searchQuery = ref('')
const sortKey = ref(null)
const sortDir = ref(1)
const openStatusMenu = ref(null)
const menuPos = ref({ top: 0, left: 0 })

const statusLabels = {
  new: 'New',
  sales: 'Sales',
  ongoing: 'On-going',
  snagg: 'Snagg'
}

const filters = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'sales', label: 'Sales' },
  { value: 'ongoing', label: 'On-going' },
  { value: 'snagg', label: 'Snagg list' }
]

const fmt = new Intl.NumberFormat('en-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
})

function clientName(id) {
  return clients.find(c => c.id === id)?.name || '—'
}

const counts = computed(() => ({
  new: projects.filter(p => p.status === 'new').length,
  sales: projects.filter(p => p.status === 'sales').length,
  ongoing: projects.filter(p => p.status === 'ongoing').length,
  snagg: projects.filter(p => p.status === 'snagg').length
}))

const filteredProjects = computed(() => {
  let rows = projects.map(p => ({ ...p, clientName: clientName(p.clientId) }))

  if (currentFilter.value !== 'all') {
    rows = rows.filter(p => p.status === currentFilter.value)
  }

  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    rows = rows.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.clientName.toLowerCase().includes(q) ||
      p.location.toLowerCase().includes(q)
    )
  }

  if (sortKey.value) {
    const k = sortKey.value
    rows.sort((a, b) => {
      const av = a[k], bv = b[k]
      if (typeof av === 'string') return av.localeCompare(bv) * sortDir.value
      return (av - bv) * sortDir.value
    })
  }

  return rows
})

function toggleSort(key) {
  if (sortKey.value === key) {
    sortDir.value = -sortDir.value
  } else {
    sortKey.value = key
    sortDir.value = 1
  }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 1 ? '↑' : '↓'
}

function toggleStatusMenu(id, ev) {
  if (openStatusMenu.value === id) {
    openStatusMenu.value = null
    return
  }
  const rect = ev.currentTarget.getBoundingClientRect()
  menuPos.value = { top: rect.bottom + 4, left: rect.left }
  openStatusMenu.value = id
}

function setStatus(projectId, value) {
  const proj = projects.find(p => p.id === projectId)
  if (proj) proj.status = value
  openStatusMenu.value = null
}

function closeStatusMenu(e) {
  if (!openStatusMenu.value) return
  if (e.target.closest('.status-wrap, .status-menu')) return
  openStatusMenu.value = null
}

function handleScroll() {
  openStatusMenu.value = null
}

onMounted(() => {
  window.addEventListener('click', closeStatusMenu)
  window.addEventListener('scroll', handleScroll, true)
})
onBeforeUnmount(() => {
  window.removeEventListener('click', closeStatusMenu)
  window.removeEventListener('scroll', handleScroll, true)
})
</script>

<template>
  <section class="stats">
    <div class="stat">
      <div class="stat-label"><span class="dot dot-new"></span>New projects</div>
      <div class="stat-value">{{ counts.new }}</div>
    </div>
    <div class="stat">
      <div class="stat-label"><span class="dot dot-sales"></span>Sales</div>
      <div class="stat-value">{{ counts.sales }}</div>
    </div>
    <div class="stat">
      <div class="stat-label"><span class="dot dot-ongoing"></span>On-going</div>
      <div class="stat-value">{{ counts.ongoing }}</div>
    </div>
    <div class="stat">
      <div class="stat-label"><span class="dot dot-snagg"></span>Snagg list</div>
      <div class="stat-value">{{ counts.snagg }}</div>
    </div>
  </section>

  <div class="controls">
    <button
      v-for="f in filters"
      :key="f.value"
      class="chip"
      :class="{ active: currentFilter === f.value }"
      @click="currentFilter = f.value"
    >
      {{ f.label }}
    </button>
    <input v-model="searchQuery" class="search" placeholder="Search..." />
    <button class="add" @click="$emit('new-project')">+ New project</button>
  </div>

  <div class="table-wrap">
    <table>
      <colgroup>
        <col style="width:34%">
        <col style="width:24%">
        <col style="width:20%">
        <col style="width:14%">
        <col style="width:8%">
      </colgroup>
      <thead>
        <tr>
          <th @click="toggleSort('name')" :class="{ sorted: sortKey === 'name' }">
            Project<span class="sort-ind">{{ sortIndicator('name') }}</span>
          </th>
          <th @click="toggleSort('clientName')" :class="{ sorted: sortKey === 'clientName' }">
            Client<span class="sort-ind">{{ sortIndicator('clientName') }}</span>
          </th>
          <th @click="toggleSort('location')" :class="{ sorted: sortKey === 'location' }">
            Location<span class="sort-ind">{{ sortIndicator('location') }}</span>
          </th>
          <th @click="toggleSort('budget')" :class="{ sorted: sortKey === 'budget' }" style="text-align:right;">
            Budget<span class="sort-ind">{{ sortIndicator('budget') }}</span>
          </th>
          <th style="text-align:center;">Lang</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in filteredProjects" :key="p.id">
          <td>
            <span class="proj-name">{{ p.name }}</span>
            <span class="status-wrap">
              <button
                type="button"
                class="status"
                :class="p.status"
                @click.stop="toggleStatusMenu(p.id, $event)"
                :aria-expanded="openStatusMenu === p.id"
              >
                {{ statusLabels[p.status] }}
                <span class="status-caret">▾</span>
              </button>
            </span>
          </td>
          <td>{{ p.clientName }}</td>
          <td>{{ p.location }}</td>
          <td class="budget">{{ fmt.format(p.budget) }}</td>
          <td class="lang">{{ p.languages.join(' · ') }}</td>
        </tr>
        <tr v-if="!filteredProjects.length">
          <td colspan="5" class="empty">No projects match your filters</td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="footer-note">{{ filteredProjects.length }} of {{ projects.length }} projects · Updated today</p>

  <Teleport to="body">
    <div
      v-if="openStatusMenu !== null"
      class="status-menu"
      :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
      @click.stop
    >
      <button
        v-for="s in statusOptions"
        :key="s.value"
        type="button"
        class="status-menu-item"
        :class="{ current: s.value === projects.find(p => p.id === openStatusMenu)?.status }"
        @click="setStatus(openStatusMenu, s.value)"
      >
        <span class="status" :class="s.value">{{ statusLabels[s.value] }}</span>
      </button>
    </div>
  </Teleport>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 22px;
}

.stat {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius);
  padding: 14px 16px;
}

.stat-label {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--m-ink-3);
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot-new { background: var(--m-dot-new); }
.dot-sales { background: var(--m-dot-sales); }
.dot-ongoing { background: var(--m-dot-ongoing); }
.dot-snagg { background: var(--m-dot-snagg); }

.stat-value {
  font-family: var(--font-display);
  font-size: 28px;
  margin-top: 4px;
}

.controls {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.chip {
  font-size: 13px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 0.5px solid var(--m-line);
  background: transparent;
  color: var(--m-ink-2);
  letter-spacing: 0.02em;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.chip:hover {
  background: var(--m-paper);
}

.chip.active {
  background: var(--m-ink);
  color: var(--m-paper);
  border-color: var(--m-ink);
}

.search {
  margin-left: auto;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  padding: 8px 12px;
  color: var(--m-ink);
  width: 180px;
  outline: none;
  transition: border-color 0.15s;
}

.search:focus {
  border-color: var(--m-brass);
}

.search::placeholder {
  color: var(--m-ink-3);
}

.add {
  background: var(--m-ink);
  color: var(--m-paper);
  border: none;
  border-radius: var(--radius);
  padding: 9px 16px;
  font-size: 13px;
  letter-spacing: 0.02em;
  transition: opacity 0.15s;
}

.add:hover {
  opacity: 0.88;
}

.table-wrap {
  background: var(--m-paper);
  border-radius: var(--radius-lg);
  border: 0.5px solid var(--m-line-soft);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed;
}

th {
  text-align: left;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--m-ink-3);
  font-weight: 400;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--m-line);
  cursor: pointer;
  user-select: none;
}

th:hover {
  color: var(--m-ink);
}

th.sorted {
  color: var(--m-ink);
}

.sort-ind {
  margin-left: 4px;
  color: var(--m-brass);
}

td {
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--m-line-soft);
  color: var(--m-ink-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr {
  cursor: pointer;
  transition: background 0.15s;
}

tbody tr:hover {
  background: var(--m-paper-2);
}

.proj-name {
  color: var(--m-ink);
  font-weight: 500;
  display: block;
  margin-bottom: 4px;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  letter-spacing: 0.04em;
  padding: 2px 9px;
  border-radius: 3px;
  border: none;
  font-family: inherit;
  cursor: pointer;
}

button.status {
  transition: filter 0.15s;
}

button.status:hover {
  filter: brightness(0.96);
}

.status-caret {
  font-size: 9px;
  opacity: 0.7;
  margin-left: 1px;
}

.status.new { background: var(--m-status-new-bg); color: var(--m-status-new-fg); }
.status.sales { background: var(--m-status-sales-bg); color: var(--m-status-sales-fg); }
.status.ongoing { background: var(--m-status-ongoing-bg); color: var(--m-status-ongoing-fg); }
.status.snagg { background: var(--m-status-snagg-bg); color: var(--m-status-snagg-fg); }

.status-wrap {
  position: relative;
  display: inline-block;
}

.status-menu {
  position: fixed;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  padding: 4px;
  z-index: 20;
  box-shadow: 0 6px 20px rgba(42, 36, 29, 0.1);
  min-width: 130px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-menu-item {
  background: transparent;
  border: none;
  padding: 6px 8px;
  text-align: left;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.1s;
}

.status-menu-item:hover {
  background: var(--m-paper-2);
}

.status-menu-item.current {
  background: var(--m-paper-2);
}

.status-menu-item .status {
  cursor: pointer;
}

.budget {
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--m-ink);
}

.lang {
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.06em;
  color: var(--m-ink-3);
  white-space: normal;
  line-height: 1.4;
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--m-ink-3);
  font-style: italic;
}

.footer-note {
  margin-top: 14px;
  font-size: 12px;
  color: var(--m-ink-3);
  text-align: right;
  letter-spacing: 0.04em;
}
</style>
