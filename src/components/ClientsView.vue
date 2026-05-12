<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClients } from '../composables/useClients'
import { useProjects } from '../composables/useProjects'

const { clients, load: loadClients } = useClients()
const { projects, load: loadProjects } = useProjects()

const searchQuery = ref('')
const sortKey = ref('name')
const sortDir = ref(1)
const selectedId = ref(null)

onMounted(() => {
  loadClients()
  loadProjects()
})

const projectsByClient = computed(() => {
  const map = new Map()
  for (const p of projects.value) {
    if (!map.has(p.client_id)) map.set(p.client_id, [])
    map.get(p.client_id).push(p)
  }
  return map
})

const rows = computed(() => {
  let list = clients.value.map(c => {
    const projs = projectsByClient.value.get(c.id) || []
    return {
      ...c,
      projectCount: projs.length,
      lifetime: projs.reduce((sum, p) => sum + Number(p.budget || 0), 0)
    }
  })

  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.language || '').toLowerCase().includes(q)
    )
  }

  if (sortKey.value) {
    const k = sortKey.value
    list.sort((a, b) => {
      const av = a[k], bv = b[k]
      if (typeof av === 'string') return av.localeCompare(bv) * sortDir.value
      return (av - bv) * sortDir.value
    })
  }

  return list
})

const fmt = new Intl.NumberFormat('en-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
})

function toggleSort(key) {
  if (sortKey.value === key) sortDir.value = -sortDir.value
  else { sortKey.value = key; sortDir.value = 1 }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return ''
  return sortDir.value === 1 ? '↑' : '↓'
}

const selectedClient = computed(() => clients.value.find(c => c.id === selectedId.value))
const selectedProjects = computed(() =>
  selectedId.value ? (projectsByClient.value.get(selectedId.value) || []) : []
)

function selectClient(id) {
  selectedId.value = selectedId.value === id ? null : id
}
</script>

<template>
  <header class="view-head">
    <div>
      <div class="eyebrow">Directory</div>
      <h2 class="view-title">Clients</h2>
    </div>
    <div class="head-stats">
      <div class="head-stat">
        <span class="head-stat-num">{{ clients.length }}</span>
        <span class="head-stat-lbl">Total</span>
      </div>
      <div class="head-stat">
        <span class="head-stat-num">{{ projects.length }}</span>
        <span class="head-stat-lbl">Projects</span>
      </div>
    </div>
  </header>

  <div class="controls">
    <input v-model="searchQuery" class="search" placeholder="Search by name, email, language..." />
  </div>

  <div class="layout" :class="{ 'has-detail': selectedClient }">
    <div class="table-wrap">
      <table>
        <colgroup>
          <col style="width:30%">
          <col style="width:30%">
          <col style="width:14%">
          <col style="width:10%">
          <col style="width:16%">
        </colgroup>
        <thead>
          <tr>
            <th @click="toggleSort('name')" :class="{ sorted: sortKey === 'name' }">
              Client<span class="sort-ind">{{ sortIndicator('name') }}</span>
            </th>
            <th>Contact</th>
            <th>Language</th>
            <th @click="toggleSort('projectCount')" :class="{ sorted: sortKey === 'projectCount' }" style="text-align:right;">
              Projects<span class="sort-ind">{{ sortIndicator('projectCount') }}</span>
            </th>
            <th @click="toggleSort('lifetime')" :class="{ sorted: sortKey === 'lifetime' }" style="text-align:right;">
              Lifetime<span class="sort-ind">{{ sortIndicator('lifetime') }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="c in rows"
            :key="c.id"
            :class="{ active: selectedId === c.id }"
            @click="selectClient(c.id)"
          >
            <td>
              <span class="client-name">{{ c.name }}</span>
            </td>
            <td class="contact">
              <span class="email">{{ c.email || '—' }}</span>
              <span class="phone">{{ c.phone || '' }}</span>
            </td>
            <td class="langs">
              <span v-if="c.language" class="lang-tag">{{ c.language }}</span>
            </td>
            <td class="num">{{ c.projectCount }}</td>
            <td class="num">{{ fmt.format(c.lifetime) }}</td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="5" class="empty">No clients match your search</td>
          </tr>
        </tbody>
      </table>
    </div>

    <aside v-if="selectedClient" class="detail">
      <button class="detail-close" @click="selectedId = null" aria-label="Close">×</button>
      <div class="detail-eyebrow">Client file</div>
      <h3 class="detail-name">{{ selectedClient.name }}</h3>

      <div class="detail-section">
        <div class="detail-row"><span>Email</span><span>{{ selectedClient.email || '—' }}</span></div>
        <div class="detail-row"><span>Phone</span><span>{{ selectedClient.phone || '—' }}</span></div>
        <div class="detail-row">
          <span>Language</span>
          <span class="langs-inline">
            <span v-if="selectedClient.language" class="lang-tag">{{ selectedClient.language }}</span>
          </span>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-head">Projects · {{ selectedProjects.length }}</div>
        <ul class="project-list">
          <li v-for="p in selectedProjects" :key="p.id">
            <span class="proj-name">{{ p.name }}</span>
            <span class="proj-meta">{{ p.location || '—' }} · {{ fmt.format(p.budget) }}</span>
          </li>
          <li v-if="!selectedProjects.length" class="empty-mini">No projects yet</li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.view-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
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

.head-stats {
  display: flex;
  gap: 24px;
}

.head-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.head-stat-num {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--m-ink);
}

.head-stat-lbl {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--m-ink-3);
  text-transform: uppercase;
}

.controls {
  margin-bottom: 16px;
}

.search {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  padding: 9px 14px;
  color: var(--m-ink);
  width: 100%;
  max-width: 360px;
  outline: none;
  transition: border-color 0.15s;
}

.search:focus {
  border-color: var(--m-brass);
}

.search::placeholder {
  color: var(--m-ink-3);
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  transition: grid-template-columns 0.2s;
}

.layout.has-detail {
  grid-template-columns: 1fr 320px;
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

tbody tr.active {
  background: var(--m-paper-2);
  box-shadow: inset 3px 0 0 var(--m-brass);
}

.client-name {
  color: var(--m-ink);
  font-weight: 500;
}

.contact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}

.contact .email {
  color: var(--m-ink);
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact .phone {
  color: var(--m-ink-3);
  font-size: 12px;
}

.langs {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  white-space: normal;
}

.lang-tag {
  display: inline-block;
  font-size: 10px;
  letter-spacing: 0.08em;
  padding: 2px 7px;
  border-radius: 3px;
  background: var(--m-cream-2);
  color: var(--m-ink-2);
}

.num {
  text-align: right;
  color: var(--m-ink);
  font-variant-numeric: tabular-nums;
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--m-ink-3);
  font-style: italic;
}

.detail {
  position: relative;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius-lg);
  padding: 22px 22px 20px;
  align-self: start;
}

.detail-close {
  position: absolute;
  top: 12px;
  right: 14px;
  background: transparent;
  border: none;
  color: var(--m-ink-3);
  font-size: 22px;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
}

.detail-close:hover {
  color: var(--m-ink);
}

.detail-eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--m-brass);
  margin-bottom: 4px;
}

.detail-name {
  font-size: 22px;
  margin-bottom: 16px;
  letter-spacing: 0.01em;
}

.detail-section {
  padding: 14px 0;
  border-top: 0.5px solid var(--m-line-soft);
}

.detail-section:first-of-type {
  border-top: none;
  padding-top: 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 13px;
  gap: 12px;
}

.detail-row > span:first-child {
  color: var(--m-ink-3);
  font-size: 12px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.detail-row > span:last-child {
  color: var(--m-ink);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
}

.langs-inline {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.detail-head {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--m-ink-3);
  text-transform: uppercase;
  margin-bottom: 10px;
}

.project-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-list li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  background: var(--m-paper-2);
  border-radius: 4px;
}

.proj-name {
  font-size: 13px;
  color: var(--m-ink);
  font-weight: 500;
}

.proj-meta {
  font-size: 12px;
  color: var(--m-ink-3);
}

.empty-mini {
  font-size: 12px;
  color: var(--m-ink-3);
  font-style: italic;
  padding: 8px 10px;
}
</style>
