<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const route = useRoute()

const project = ref(null)
const loading = ref(false)
const error = ref(null)

const statusLabels = {
  new: 'New',
  sales: 'Sales',
  ongoing: 'On-going',
  snagg: 'Snagg'
}

const currencySymbols = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  AED: 'AED',
  CHF: 'CHF'
}

const fmtBudget = computed(() => {
  if (!project.value) return ''
  const symbol = currencySymbols[project.value.currency] || ''
  const amount = new Intl.NumberFormat('en-DE', { maximumFractionDigits: 0 }).format(project.value.budget || 0)
  return `${symbol}${amount}`
})

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function load(id) {
  loading.value = true
  error.value = null
  const { data, error: err } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('id', id)
    .single()
  if (err) error.value = err
  else project.value = data
  loading.value = false
}

onMounted(() => load(route.params.id))
watch(() => route.params.id, (id) => { if (id) load(id) })
</script>

<template>
  <div class="detail-shell">
    <button class="back" @click="router.push({ name: 'projects' })">← Back to projects</button>

    <p v-if="loading" class="status-line">Loading project…</p>
    <p v-if="error" class="status-line error">{{ error.message || 'Failed to load project.' }}</p>

    <template v-if="project && !loading">
      <div class="eyebrow">Project</div>
      <div class="title-row">
        <h2 class="title">{{ project.name }}</h2>
        <span class="status" :class="project.status">{{ statusLabels[project.status] }}</span>
      </div>
      <p class="sub">{{ project.location || 'No location' }}</p>

      <section class="card">
        <div class="card-head">Overview</div>
        <div class="row"><span>Client</span><span>{{ project.client?.name || '—' }}</span></div>
        <div class="row"><span>Location</span><span>{{ project.location || '—' }}</span></div>
        <div class="row"><span>Budget</span><span>{{ fmtBudget }}</span></div>
        <div class="row">
          <span>Languages</span>
          <span class="langs">
            <span v-for="l in (project.language || [])" :key="l" class="lang-tag">{{ l }}</span>
            <span v-if="!project.language || !project.language.length">—</span>
          </span>
        </div>
        <div class="row"><span>Start date</span><span>{{ fmtDate(project.start_date) }}</span></div>
        <div class="row"><span>Expected end</span><span>{{ fmtDate(project.expected_end_date) }}</span></div>
      </section>

      <section v-if="project.client" class="card">
        <div class="card-head">Client contact</div>
        <div class="row"><span>Name</span><span>{{ project.client.name }}</span></div>
        <div class="row"><span>Email</span><span>{{ project.client.email || '—' }}</span></div>
        <div class="row"><span>Phone</span><span>{{ project.client.phone || '—' }}</span></div>
        <div class="row"><span>Language</span><span>{{ project.client.language || '—' }}</span></div>
      </section>

      <section class="card">
        <div class="card-head">Notes</div>
        <p v-if="project.notes" class="notes">{{ project.notes }}</p>
        <p v-else class="notes empty">No notes recorded for this project.</p>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-shell {
  max-width: 760px;
  margin: 0 auto;
}

.back {
  background: transparent;
  border: none;
  color: var(--m-ink-3);
  font-size: 13px;
  padding: 0;
  margin-bottom: 16px;
  letter-spacing: 0.02em;
  transition: color 0.15s;
  cursor: pointer;
}

.back:hover {
  color: var(--m-ink);
}

.eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--m-brass);
  margin-bottom: 6px;
  text-transform: uppercase;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 6px;
}

.title {
  font-size: 32px;
  letter-spacing: 0.02em;
  margin: 0;
}

.sub {
  color: var(--m-ink-3);
  font-size: 14px;
  margin: 0 0 28px;
}

.status {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  letter-spacing: 0.04em;
  padding: 3px 10px;
  border-radius: 3px;
}

.status.new { background: var(--m-status-new-bg); color: var(--m-status-new-fg); }
.status.sales { background: var(--m-status-sales-bg); color: var(--m-status-sales-fg); }
.status.ongoing { background: var(--m-status-ongoing-bg); color: var(--m-status-ongoing-fg); }
.status.snagg { background: var(--m-status-snagg-bg); color: var(--m-status-snagg-fg); }

.card {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius-lg);
  padding: 18px 22px;
  margin-bottom: 16px;
}

.card-head {
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--m-ink-3);
  text-transform: uppercase;
  margin-bottom: 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-top: 0.5px solid var(--m-line-soft);
  gap: 16px;
}

.row:first-of-type {
  border-top: none;
}

.row > span:first-child {
  color: var(--m-ink-3);
  font-size: 12px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.row > span:last-child {
  color: var(--m-ink);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
}

.langs {
  display: inline-flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: flex-end;
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

.notes {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--m-ink);
  white-space: pre-wrap;
}

.notes.empty {
  color: var(--m-ink-3);
  font-style: italic;
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
</style>
