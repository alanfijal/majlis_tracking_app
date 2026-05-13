<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useProjects } from '../composables/useProjects'
import { useClients } from '../composables/useClients'

const {
  loadArchived: loadArchivedProjects,
  restoreProject,
  deleteProject
} = useProjects()
const {
  loadArchived: loadArchivedClients,
  restoreClient,
  deleteClient
} = useClients()

const tabs = [
  { id: 'projects', label: 'Projects' },
  { id: 'clients', label: 'Clients' }
]
const activeTab = ref('projects')

const archivedProjects = ref([])
const archivedClients = ref([])
const projectRefCounts = ref(new Map())
const loading = ref(false)
const error = ref(null)
const busyId = ref(null)

const fmt = new Intl.NumberFormat('en-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0
})

const statusLabels = {
  new: 'New',
  sales: 'Sales',
  ongoing: 'On-going',
  snagg: 'Snagg'
}

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const [projs, clis] = await Promise.all([
      loadArchivedProjects(),
      loadArchivedClients()
    ])
    archivedProjects.value = projs
    archivedClients.value = clis
    await refreshClientRefCounts()
  } catch (e) {
    error.value = e
  } finally {
    loading.value = false
  }
}

async function refreshClientRefCounts() {
  if (!archivedClients.value.length) {
    projectRefCounts.value = new Map()
    return
  }
  const ids = archivedClients.value.map(c => c.id)
  const { data, error: err } = await supabase
    .from('projects')
    .select('client_id')
    .in('client_id', ids)
  if (err) throw err
  const map = new Map()
  for (const row of data || []) {
    map.set(row.client_id, (map.get(row.client_id) || 0) + 1)
  }
  projectRefCounts.value = map
}

onMounted(refresh)

async function onRestoreProject(p) {
  if (busyId.value) return
  busyId.value = `p:${p.id}`
  try {
    await restoreProject(p.id)
    archivedProjects.value = archivedProjects.value.filter(x => x.id !== p.id)
  } catch (e) {
    error.value = e
  } finally {
    busyId.value = null
  }
}

async function onDeleteProject(p) {
  if (busyId.value) return
  const ok = window.confirm(
    `Permanently delete “${p.name}”? This cannot be undone.`
  )
  if (!ok) return
  busyId.value = `p:${p.id}`
  try {
    await deleteProject(p.id)
    archivedProjects.value = archivedProjects.value.filter(x => x.id !== p.id)
    await refreshClientRefCounts()
  } catch (e) {
    error.value = e
  } finally {
    busyId.value = null
  }
}

async function onRestoreClient(c) {
  if (busyId.value) return
  busyId.value = `c:${c.id}`
  try {
    await restoreClient(c.id)
    archivedClients.value = archivedClients.value.filter(x => x.id !== c.id)
  } catch (e) {
    error.value = e
  } finally {
    busyId.value = null
  }
}

async function onDeleteClient(c) {
  if (busyId.value) return
  const refs = projectRefCounts.value.get(c.id) || 0
  if (refs > 0) {
    window.alert(
      `Can’t permanently delete “${c.name}” — ${refs} project${refs === 1 ? '' : 's'} still reference this client. Delete or reassign those projects first.`
    )
    return
  }
  const ok = window.confirm(
    `Permanently delete “${c.name}”? This cannot be undone.`
  )
  if (!ok) return
  busyId.value = `c:${c.id}`
  try {
    await deleteClient(c.id)
    archivedClients.value = archivedClients.value.filter(x => x.id !== c.id)
  } catch (e) {
    error.value = e
  } finally {
    busyId.value = null
  }
}

const counts = computed(() => ({
  projects: archivedProjects.value.length,
  clients: archivedClients.value.length
}))
</script>

<template>
  <header class="view-head">
    <div>
      <div class="eyebrow">Archive</div>
      <h2 class="view-title">Archived items</h2>
    </div>
    <div class="head-stats">
      <div class="head-stat">
        <span class="head-stat-num">{{ counts.projects }}</span>
        <span class="head-stat-lbl">Projects</span>
      </div>
      <div class="head-stat">
        <span class="head-stat-num">{{ counts.clients }}</span>
        <span class="head-stat-lbl">Clients</span>
      </div>
    </div>
  </header>

  <div class="tabs">
    <button
      v-for="t in tabs"
      :key="t.id"
      class="chip"
      :class="{ active: activeTab === t.id }"
      @click="activeTab = t.id"
    >
      {{ t.label }}
    </button>
  </div>

  <p v-if="loading" class="status-line">Loading archive…</p>
  <p v-if="error" class="status-line error">{{ error.message || 'Failed to load archive.' }}</p>

  <div v-if="activeTab === 'projects'" class="table-wrap">
    <table>
      <colgroup>
        <col style="width:26%">
        <col style="width:20%">
        <col style="width:16%">
        <col style="width:12%">
        <col style="width:26%">
      </colgroup>
      <thead>
        <tr>
          <th>Project</th>
          <th>Client</th>
          <th>Location</th>
          <th style="text-align:right;">Budget</th>
          <th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in archivedProjects" :key="p.id">
          <td>
            <span class="proj-name">{{ p.name }}</span>
            <span class="status" :class="p.status">{{ statusLabels[p.status] }}</span>
          </td>
          <td>{{ p.client?.name || '—' }}</td>
          <td>{{ p.location || '—' }}</td>
          <td class="budget">{{ fmt.format(p.budget || 0) }}</td>
          <td class="actions-cell">
            <button
              class="row-btn restore"
              :disabled="busyId === `p:${p.id}`"
              @click="onRestoreProject(p)"
            >Restore</button>
            <button
              class="row-btn danger"
              :disabled="busyId === `p:${p.id}`"
              @click="onDeleteProject(p)"
            >Delete</button>
          </td>
        </tr>
        <tr v-if="!archivedProjects.length && !loading">
          <td colspan="5" class="empty">No archived projects</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div v-else class="table-wrap">
    <table>
      <colgroup>
        <col style="width:22%">
        <col style="width:30%">
        <col style="width:10%">
        <col style="width:10%">
        <col style="width:28%">
      </colgroup>
      <thead>
        <tr>
          <th>Client</th>
          <th>Contact</th>
          <th>Language</th>
          <th style="text-align:right;">Projects</th>
          <th style="text-align:right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in archivedClients" :key="c.id">
          <td><span class="client-name">{{ c.name }}</span></td>
          <td>
            <div class="contact">
              <span class="email">{{ c.email || '—' }}</span>
              <span class="phone">{{ c.phone || '' }}</span>
            </div>
          </td>
          <td>
            <span v-if="c.language" class="lang-tag">{{ c.language }}</span>
            <span v-else>—</span>
          </td>
          <td class="num">{{ projectRefCounts.get(c.id) || 0 }}</td>
          <td class="actions-cell">
            <button
              class="row-btn restore"
              :disabled="busyId === `c:${c.id}`"
              @click="onRestoreClient(c)"
            >Restore</button>
            <button
              class="row-btn danger"
              :disabled="busyId === `c:${c.id}` || (projectRefCounts.get(c.id) || 0) > 0"
              :title="(projectRefCounts.get(c.id) || 0) > 0 ? 'Projects still reference this client' : ''"
              @click="onDeleteClient(c)"
            >Delete</button>
          </td>
        </tr>
        <tr v-if="!archivedClients.length && !loading">
          <td colspan="5" class="empty">No archived clients</td>
        </tr>
      </tbody>
    </table>
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

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
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

.status-line {
  margin: 0 0 12px;
  font-size: 12px;
  font-style: italic;
  color: var(--m-brass);
  letter-spacing: 0.04em;
}

.status-line.error {
  color: var(--m-status-snagg-fg);
  font-style: normal;
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

.proj-name,
.client-name {
  color: var(--m-ink);
  font-weight: 500;
  display: inline-block;
  margin-right: 8px;
}

.status {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  letter-spacing: 0.04em;
  padding: 2px 9px;
  border-radius: 3px;
}

.status.new { background: var(--m-status-new-bg); color: var(--m-status-new-fg); }
.status.sales { background: var(--m-status-sales-bg); color: var(--m-status-sales-fg); }
.status.ongoing { background: var(--m-status-ongoing-bg); color: var(--m-status-ongoing-fg); }
.status.snagg { background: var(--m-status-snagg-bg); color: var(--m-status-snagg-fg); }

.contact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}

.contact .email {
  color: var(--m-ink);
}

.contact .phone {
  color: var(--m-ink-3);
  font-size: 12px;
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

.budget,
.num {
  text-align: right;
  color: var(--m-ink);
  font-variant-numeric: tabular-nums;
}

.actions-cell {
  text-align: right;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
}

.row-btn {
  background: transparent;
  border: 0.5px solid var(--m-line);
  color: var(--m-ink-2);
  padding: 5px 11px;
  border-radius: var(--radius);
  font-size: 12px;
  letter-spacing: 0.04em;
  font-family: inherit;
  cursor: pointer;
  margin-left: 6px;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.row-btn:hover:not(:disabled) {
  background: var(--m-ink);
  color: var(--m-paper);
  border-color: var(--m-ink);
}

.row-btn.danger:hover:not(:disabled) {
  background: var(--m-status-snagg-bg);
  color: var(--m-status-snagg-fg);
  border-color: var(--m-status-snagg-bg);
}

.row-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.empty {
  padding: 40px;
  text-align: center;
  color: var(--m-ink-3);
  font-style: italic;
}
</style>
