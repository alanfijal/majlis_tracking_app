<script setup>
import { ref, computed } from 'vue'
import { clients, statusOptions, languageOptions, currencyOptions } from '../data.js'

const emit = defineEmits(['cancel', 'save'])

const projectName = ref('')
const location = ref('')
const budget = ref('')
const currency = ref('EUR')
const languages = ref(['EN'])
const status = ref('new')

function toggleProjectLanguage(code) {
  const list = languages.value
  const idx = list.indexOf(code)
  if (idx === -1) list.push(code)
  else if (list.length > 1) list.splice(idx, 1)
}
const startDate = ref('')
const endDate = ref('')
const notes = ref('')

const clientMode = ref('existing')
const selectedClientId = ref(null)
const clientSearch = ref('')
const showClientDropdown = ref(false)

const newClient = ref({
  name: '',
  email: '',
  phone: '',
  languages: ['EN']
})

function toggleNewClientLanguage(code) {
  const list = newClient.value.languages
  const idx = list.indexOf(code)
  if (idx === -1) list.push(code)
  else if (list.length > 1) list.splice(idx, 1)
}

const filteredClients = computed(() => {
  const q = clientSearch.value.toLowerCase().trim()
  if (!q) return clients
  return clients.filter(c => c.name.toLowerCase().includes(q))
})

const selectedClient = computed(() =>
  clients.find(c => c.id === selectedClientId.value)
)

const projectLanguageOptions = computed(() => {
  const codes = clientMode.value === 'existing'
    ? selectedClient.value?.languages
    : newClient.value.languages
  if (!codes || !codes.length) return languageOptions
  return languageOptions.filter(l => codes.includes(l.value))
})

function selectClient(client) {
  selectedClientId.value = client.id
  clientSearch.value = client.name
  if (client.languages?.length) languages.value = [...client.languages]
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
  newClient.value = { name: '', email: '', phone: '', languages: ['EN'] }
}

function hideDropdownDelayed() {
  setTimeout(() => { showClientDropdown.value = false }, 180)
}

const isValid = computed(() => {
  if (!projectName.value.trim()) return false
  if (!location.value.trim()) return false
  if (!budget.value || Number(budget.value) <= 0) return false
  if (clientMode.value === 'existing' && !selectedClientId.value) return false
  if (clientMode.value === 'new') {
    if (!newClient.value.name.trim()) return false
    if (!newClient.value.languages.length) return false
  }
  if (!languages.value.length) return false
  return true
})

function handleSave() {
  if (!isValid.value) return

  const payload = {
    name: projectName.value.trim(),
    location: location.value.trim(),
    budget: Number(budget.value),
    currency: currency.value,
    languages: [...languages.value],
    status: status.value,
    startDate: startDate.value || null,
    endDate: endDate.value || null,
    notes: notes.value.trim() || null,
    client: clientMode.value === 'existing'
      ? { id: selectedClientId.value }
      : { ...newClient.value, isNew: true }
  }

  emit('save', payload)
}
</script>

<template>
  <div class="form-shell">
    <div class="form-head">
      <button class="back" @click="$emit('cancel')">← Back to projects</button>
      <h2 class="form-title">New project</h2>
      <p class="form-sub">Add a new project. Start by linking it to an existing client or creating one.</p>
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
            <span class="dropdown-meta">{{ c.languages.join(', ') }} · {{ c.email }}</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item dropdown-create" @mousedown="switchToNewClient">
            + Create new client
          </div>
        </div>

        <div v-if="selectedClient" class="client-card">
          <div class="client-card-row"><span>Email</span><span>{{ selectedClient.email }}</span></div>
          <div class="client-card-row"><span>Phone</span><span>{{ selectedClient.phone }}</span></div>
          <div class="client-card-row"><span>Languages</span><span>{{ selectedClient.languages.join(', ') }}</span></div>
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
          <label class="field-label">Languages spoken</label>
          <div class="lang-chips">
            <button
              v-for="l in languageOptions"
              :key="l.value"
              type="button"
              class="lang-chip"
              :class="{ active: newClient.languages.includes(l.value) }"
              @click="toggleNewClientLanguage(l.value)"
            >
              {{ l.label }}
            </button>
          </div>
          <p class="field-hint">Tap to add or remove. At least one language is required.</p>
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
              v-for="l in projectLanguageOptions"
              :key="l.value"
              type="button"
              class="lang-chip"
              :class="{ active: languages.includes(l.value) }"
              @click="toggleProjectLanguage(l.value)"
            >
              {{ l.label }}
            </button>
          </div>
          <p class="field-hint">Pick one or more. At least one is required.</p>
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

    <div class="form-actions">
      <button class="btn-secondary" @click="$emit('cancel')">Cancel</button>
      <button class="btn-primary" :disabled="!isValid" @click="handleSave">Save project</button>
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

.btn-secondary:hover {
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

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
