<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClients } from '../composables/useClients'
import { useProjects } from '../composables/useProjects'
import { statusOptions, languageOptions, currencyOptions } from '../lib/options'
import { supabase } from '../lib/supabase'

const router = useRouter()
const route = useRoute()
const { clients, load: loadClients, createClient } = useClients()
const { createProject, updateProject } = useProjects()

const editingId = computed(() => route.name === 'project-edit' ? route.params.id : null)
const isEditing = computed(() => !!editingId.value)
const loadingProject = ref(false)
const loadError = ref(null)

const projectName = ref('')
const location = ref('')
const budget = ref('')
const currency = ref('EUR')
const languages = ref(['EN'])

function toggleProjectLanguage(code) {
  const list = languages.value
  const idx = list.indexOf(code)
  if (idx === -1) list.push(code)
  else if (list.length > 1) list.splice(idx, 1)
}
const status = ref('new')
const startDate = ref('')
const endDate = ref('')
const notes = ref('')

const saving = ref(false)
const saveError = ref(null)

const clientMode = ref('existing')
const selectedClientId = ref(null)
const clientSearch = ref('')
const showClientDropdown = ref(false)

const newClient = ref({
  name: '',
  email: '',
  phone: '',
  language: 'EN'
})

const filteredClients = computed(() => {
  const q = clientSearch.value.toLowerCase().trim()
  if (!q) return clients.value
  return clients.value.filter(c => c.name.toLowerCase().includes(q))
})

const selectedClient = computed(() =>
  clients.value.find(c => c.id === selectedClientId.value)
)

function selectClient(client) {
  selectedClientId.value = client.id
  clientSearch.value = client.name
  if (client.language) languages.value = [client.language]
  showClientDropdown.value = false
}

function clearClient() {
  selectedClientId.value = null
  clientSearch.value = ''
}

function switchToNewClient() {
  clientMode.value = 'new'
  selectedClientId.value = null
  clientSearch.value = ''
  showClientDropdown.value = false
}

function switchToExistingClient() {
  clientMode.value = 'existing'
  newClient.value = { name: '', email: '', phone: '', language: 'EN' }
}

function hideDropdownDelayed() {
  setTimeout(() => { showClientDropdown.value = false }, 180)
}

const isValid = computed(() => {
  if (!projectName.value.trim()) return false
  if (clientMode.value === 'new' && newClient.value.name.trim() && !newClient.value.language) return false
  return true
})

async function handleSave() {
  if (!isValid.value || saving.value) return
  saving.value = true
  saveError.value = null
  try {
    let clientId = selectedClientId.value
    if (clientMode.value === 'new' && newClient.value.name.trim()) {
      const created = await createClient({
        name: newClient.value.name.trim(),
        email: newClient.value.email.trim() || null,
        phone: newClient.value.phone.trim() || null,
        language: newClient.value.language
      })
      clientId = created.id
    }

    const payload = {
      client_id: clientId || null,
      name: projectName.value.trim(),
      location: location.value.trim() || null,
      budget: budget.value === '' || budget.value == null ? null : Number(budget.value),
      currency: currency.value,
      language: languages.value.length ? [...languages.value] : null,
      status: status.value,
      start_date: startDate.value || null,
      expected_end_date: endDate.value || null,
      notes: notes.value.trim() || null
    }

    if (isEditing.value) {
      await updateProject(editingId.value, payload)
      router.push({ name: 'project-detail', params: { id: editingId.value } })
    } else {
      await createProject(payload)
      router.push({ name: 'projects' })
    }
  } catch (e) {
    saveError.value = e.message || 'Failed to save. Try again.'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  if (isEditing.value) {
    router.push({ name: 'project-detail', params: { id: editingId.value } })
  } else {
    router.push({ name: 'projects' })
  }
}

async function loadProjectForEdit(id) {
  loadingProject.value = true
  loadError.value = null
  const { data, error: err } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('id', id)
    .single()
  if (err) {
    loadError.value = err.message || 'Failed to load project.'
    loadingProject.value = false
    return
  }
  projectName.value = data.name || ''
  location.value = data.location || ''
  budget.value = data.budget != null ? String(data.budget) : ''
  currency.value = data.currency || 'EUR'
  languages.value = Array.isArray(data.language) && data.language.length ? [...data.language] : ['EN']
  status.value = data.status || 'new'
  startDate.value = data.start_date || ''
  endDate.value = data.expected_end_date || ''
  notes.value = data.notes || ''
  if (data.client) {
    clientMode.value = 'existing'
    selectedClientId.value = data.client.id
    clientSearch.value = data.client.name
  }
  loadingProject.value = false
}

onMounted(async () => {
  await loadClients()
  if (isEditing.value) {
    await loadProjectForEdit(editingId.value)
  }
})
</script>

<template>
  <div class="form-shell">
    <div class="form-head">
      <button class="back" @click="handleCancel">
        {{ isEditing ? '← Back to project' : '← Back to projects' }}
      </button>
      <h2 class="form-title">{{ isEditing ? 'Edit project' : 'New project' }}</h2>
      <p class="form-sub">
        {{ isEditing ? 'Update the details for this project.' : 'Only a project name is required — you can fill in the rest later from the project page.' }}
      </p>
      <p v-if="loadingProject" class="status-line">Loading project…</p>
      <p v-if="loadError" class="status-line error">{{ loadError }}</p>
    </div>

    <section class="form-section">
      <div class="section-head">
        <div class="section-eyebrow">01 — Client</div>
        <h3 class="section-title">Who is this for?</h3>
      </div>

      <div class="client-toggle">
        <button :class="{ active: clientMode === 'existing' }" @click="switchToExistingClient">Existing client</button>
        <button :class="{ active: clientMode === 'new' }" @click="switchToNewClient">New client</button>
      </div>

      <div v-if="clientMode === 'existing'" class="client-picker">
        <label class="field-label">Search clients</label>
        <div class="picker-wrap">
          <input
            v-model="clientSearch"
            @focus="showClientDropdown = true"
            @blur="hideDropdownDelayed"
            placeholder="Type a client name..."
            class="text-input"
          />
          <button v-if="selectedClientId" class="clear-btn" @click="clearClient" aria-label="Clear selection">×</button>
        </div>
        <div v-if="showClientDropdown && filteredClients.length" class="dropdown">
          <div
            v-for="c in filteredClients"
            :key="c.id"
            class="dropdown-item"
            @mousedown="selectClient(c)"
          >
            <span class="dropdown-name">{{ c.name }}</span>
            <span class="dropdown-meta">{{ c.language }}{{ c.email ? ' · ' + c.email : '' }}</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item dropdown-create" @mousedown="switchToNewClient">
            + Create new client
          </div>
        </div>

        <div v-if="selectedClient" class="client-card">
          <div class="client-card-row"><span>Email</span><span>{{ selectedClient.email || '—' }}</span></div>
          <div class="client-card-row"><span>Phone</span><span>{{ selectedClient.phone || '—' }}</span></div>
          <div class="client-card-row"><span>Language</span><span>{{ selectedClient.language }}</span></div>
        </div>
      </div>

      <div v-else class="new-client">
        <div class="grid-2">
          <div class="field">
            <label class="field-label">Client name</label>
            <input v-model="newClient.name" class="text-input" placeholder="e.g. Müller Holdings" />
          </div>
          <div class="field">
            <label class="field-label">Email</label>
            <input v-model="newClient.email" type="email" class="text-input" placeholder="contact@example.com" />
          </div>
          <div class="field">
            <label class="field-label">Phone</label>
            <input v-model="newClient.phone" class="text-input" placeholder="+34 ..." />
          </div>
        </div>
        <div class="field">
          <label class="field-label">Preferred language</label>
          <div class="lang-chips">
            <button
              v-for="l in languageOptions"
              :key="l.value"
              type="button"
              class="lang-chip"
              :class="{ active: newClient.language === l.value }"
              @click="newClient.language = l.value"
            >
              {{ l.label }}
            </button>
          </div>
          <p class="field-hint">Pick one. This is the client's primary communication language.</p>
        </div>
      </div>
    </section>

    <section class="form-section">
      <div class="section-head">
        <div class="section-eyebrow">02 — Project</div>
        <h3 class="section-title">About the project</h3>
      </div>

      <div class="field">
        <label class="field-label">Project name</label>
        <input v-model="projectName" class="text-input" placeholder="e.g. Villa Sierra Blanca renovation" />
      </div>

      <div class="grid-2">
        <div class="field">
          <label class="field-label">Location</label>
          <input v-model="location" class="text-input" placeholder="e.g. Marbella" />
        </div>
        <div class="field">
          <label class="field-label">Stage</label>
          <select v-model="status" class="text-input">
            <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
        <div class="field">
          <label class="field-label">Budget</label>
          <div class="budget-input">
            <select v-model="currency" class="currency-select">
              <option v-for="c in currencyOptions" :key="c.value" :value="c.value">{{ c.value }}</option>
            </select>
            <input v-model="budget" type="number" min="0" class="text-input budget-amount" placeholder="0" />
          </div>
        </div>
        <div class="field full-width">
          <label class="field-label">Communication languages</label>
          <div class="lang-chips">
            <button
              v-for="l in languageOptions"
              :key="l.value"
              type="button"
              class="lang-chip"
              :class="{ active: languages.includes(l.value) }"
              @click="toggleProjectLanguage(l.value)"
            >
              {{ l.label }}
            </button>
          </div>
          <p class="field-hint">Tap to add or remove. Optional.</p>
        </div>
      </div>
    </section>

    <section class="form-section">
      <div class="section-head">
        <div class="section-eyebrow">03 — Timeline &amp; notes</div>
        <h3 class="section-title">When &amp; anything else</h3>
      </div>

      <div class="grid-2">
        <div class="field">
          <label class="field-label">Start date</label>
          <input v-model="startDate" type="date" class="text-input" />
        </div>
        <div class="field">
          <label class="field-label">Expected end date</label>
          <input v-model="endDate" type="date" class="text-input" />
        </div>
      </div>

      <div class="field">
        <label class="field-label">Notes</label>
        <textarea v-model="notes" class="text-input textarea" rows="4" placeholder="Style preferences, key contacts, anything worth remembering..."></textarea>
      </div>
    </section>

    <p v-if="saveError" class="save-error">{{ saveError }}</p>

    <div class="form-actions">
      <button class="btn-secondary" :disabled="saving" @click="handleCancel">Cancel</button>
      <button class="btn-primary" :disabled="!isValid || saving" @click="handleSave">
        {{ saving ? 'Saving…' : (isEditing ? 'Save changes' : 'Save project') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.form-shell {
  max-width: 760px;
  margin: 0 auto;
}

.form-head {
  margin-bottom: 36px;
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
}

.back:hover {
  color: var(--m-ink);
}

.form-title {
  font-size: 36px;
  letter-spacing: 0.02em;
  margin-bottom: 8px;
}

.form-sub {
  color: var(--m-ink-3);
  font-size: 14px;
  margin: 0;
}

.form-section {
  margin-bottom: 36px;
  padding-bottom: 28px;
  border-bottom: 0.5px solid var(--m-line-soft);
}

.form-section:last-of-type {
  border-bottom: none;
}

.section-head {
  margin-bottom: 18px;
}

.section-eyebrow {
  font-size: 11px;
  letter-spacing: 0.18em;
  color: var(--m-brass);
  margin-bottom: 6px;
}

.section-title {
  font-size: 22px;
  letter-spacing: 0.01em;
}

.client-toggle {
  display: inline-flex;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  padding: 3px;
  margin-bottom: 20px;
}

.client-toggle button {
  background: transparent;
  border: none;
  padding: 7px 16px;
  font-size: 13px;
  color: var(--m-ink-2);
  border-radius: 4px;
  letter-spacing: 0.02em;
  transition: background 0.15s, color 0.15s;
}

.client-toggle button.active {
  background: var(--m-ink);
  color: var(--m-paper);
}

.client-picker {
  position: relative;
}

.picker-wrap {
  position: relative;
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: calc(50% + 6px);
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--m-ink-3);
  font-size: 18px;
  padding: 0;
  cursor: pointer;
  line-height: 1;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-btn:hover {
  color: var(--m-ink);
}

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(42, 36, 29, 0.06);
}

.dropdown-item {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  transition: background 0.1s;
}

.dropdown-item:hover {
  background: var(--m-paper-2);
}

.dropdown-name {
  font-size: 14px;
  color: var(--m-ink);
  font-weight: 500;
}

.dropdown-meta {
  font-size: 12px;
  color: var(--m-ink-3);
}

.dropdown-divider {
  height: 0.5px;
  background: var(--m-line-soft);
  margin: 4px 0;
}

.dropdown-create {
  color: var(--m-brass);
  font-weight: 500;
  font-size: 13px;
}

.client-card {
  margin-top: 16px;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius);
  padding: 14px 18px;
}

.client-card-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
}

.client-card-row span:first-child {
  color: var(--m-ink-3);
}

.client-card-row span:last-child {
  color: var(--m-ink);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.field.full-width {
  grid-column: 1 / -1;
}

.field-label {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--m-ink-3);
  margin-bottom: 6px;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--m-ink-3);
  letter-spacing: 0.02em;
}

.lang-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lang-chip {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: var(--m-ink-2);
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.lang-chip:hover {
  border-color: var(--m-brass-soft);
  color: var(--m-ink);
}

.lang-chip.active {
  background: var(--m-ink);
  color: var(--m-paper);
  border-color: var(--m-ink);
}

.text-input {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--m-ink);
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  font-family: inherit;
}

.text-input:focus {
  border-color: var(--m-brass);
}

.text-input::placeholder {
  color: var(--m-ink-3);
}

.textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

.budget-input {
  display: flex;
  gap: 8px;
}

.currency-select {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line);
  border-radius: var(--radius);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--m-ink);
  width: 90px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.currency-select:focus {
  border-color: var(--m-brass);
}

.budget-amount {
  flex: 1;
}

.save-error {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--m-status-snagg-fg);
  text-align: right;
  letter-spacing: 0.02em;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  padding-top: 24px;
  border-top: 0.5px solid var(--m-line);
}

.btn-secondary {
  background: transparent;
  border: 0.5px solid var(--m-line);
  color: var(--m-ink-2);
  padding: 10px 20px;
  border-radius: var(--radius);
  font-size: 14px;
  letter-spacing: 0.02em;
  transition: background 0.15s, color 0.15s;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--m-paper);
  color: var(--m-ink);
}

.btn-primary {
  background: var(--m-ink);
  color: var(--m-paper);
  border: none;
  padding: 10px 24px;
  border-radius: var(--radius);
  font-size: 14px;
  letter-spacing: 0.02em;
  transition: opacity 0.15s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.status-line {
  margin: 12px 0 0;
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
