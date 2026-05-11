<script setup>
import { ref } from 'vue'
import { languageOptions, currencyOptions, statusOptions } from '../data.js'

const profile = ref({
  studioName: 'The Majlis',
  city: 'Marbella',
  email: 'studio@themajlis.com',
  phone: '+34 600 000 000'
})

const defaults = ref({
  currency: 'EUR',
  language: 'EN',
  status: 'new'
})

const display = ref({
  weekStart: 'monday',
  dateFormat: 'DD MMM YYYY',
  notifications: true,
  compactRows: false
})

const tabs = [
  { id: 'profile', label: 'Atelier' },
  { id: 'defaults', label: 'Defaults' },
  { id: 'display', label: 'Display' },
  { id: 'about', label: 'About' }
]
const activeTab = ref('profile')
</script>

<template>
  <header class="view-head">
    <div>
      <div class="eyebrow">Preferences</div>
      <h2 class="view-title">Settings</h2>
    </div>
  </header>

  <div class="settings-shell">
    <nav class="side-nav">
      <button
        v-for="t in tabs"
        :key="t.id"
        :class="{ active: activeTab === t.id }"
        @click="activeTab = t.id"
      >
        {{ t.label }}
      </button>
    </nav>

    <div class="panel">
      <section v-if="activeTab === 'profile'">
        <div class="section-eyebrow">01 — Atelier</div>
        <h3 class="section-title">Your studio</h3>
        <p class="section-sub">How your atelier shows up across the tracker.</p>

        <div class="grid-2">
          <div class="field">
            <label class="field-label">Studio name</label>
            <input v-model="profile.studioName" class="text-input" />
          </div>
          <div class="field">
            <label class="field-label">City</label>
            <input v-model="profile.city" class="text-input" />
          </div>
          <div class="field">
            <label class="field-label">Contact email</label>
            <input v-model="profile.email" type="email" class="text-input" />
          </div>
          <div class="field">
            <label class="field-label">Contact phone</label>
            <input v-model="profile.phone" class="text-input" />
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'defaults'">
        <div class="section-eyebrow">02 — Defaults</div>
        <h3 class="section-title">New project defaults</h3>
        <p class="section-sub">Values prefilled when starting a new project.</p>

        <div class="grid-2">
          <div class="field">
            <label class="field-label">Default currency</label>
            <select v-model="defaults.currency" class="text-input">
              <option v-for="c in currencyOptions" :key="c.value" :value="c.value">
                {{ c.symbol }} · {{ c.value }}
              </option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Default communication language</label>
            <select v-model="defaults.language" class="text-input">
              <option v-for="l in languageOptions" :key="l.value" :value="l.value">{{ l.label }}</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Default stage</label>
            <select v-model="defaults.status" class="text-input">
              <option v-for="s in statusOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>
      </section>

      <section v-if="activeTab === 'display'">
        <div class="section-eyebrow">03 — Display</div>
        <h3 class="section-title">Look &amp; feel</h3>
        <p class="section-sub">How information appears across the workspace.</p>

        <div class="grid-2">
          <div class="field">
            <label class="field-label">Week starts on</label>
            <select v-model="display.weekStart" class="text-input">
              <option value="monday">Monday</option>
              <option value="sunday">Sunday</option>
            </select>
          </div>
          <div class="field">
            <label class="field-label">Date format</label>
            <select v-model="display.dateFormat" class="text-input">
              <option value="DD MMM YYYY">22 April 2026</option>
              <option value="DD/MM/YYYY">22/04/2026</option>
              <option value="YYYY-MM-DD">2026-04-22</option>
            </select>
          </div>
        </div>

        <div class="toggle-row">
          <div>
            <div class="toggle-label">Email notifications</div>
            <div class="toggle-hint">Send updates when a project status changes.</div>
          </div>
          <button
            class="toggle"
            :class="{ on: display.notifications }"
            @click="display.notifications = !display.notifications"
            :aria-pressed="display.notifications"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>

        <div class="toggle-row">
          <div>
            <div class="toggle-label">Compact table rows</div>
            <div class="toggle-hint">Show more rows at once by reducing row height.</div>
          </div>
          <button
            class="toggle"
            :class="{ on: display.compactRows }"
            @click="display.compactRows = !display.compactRows"
            :aria-pressed="display.compactRows"
          >
            <span class="toggle-knob"></span>
          </button>
        </div>
      </section>

      <section v-if="activeTab === 'about'">
        <div class="section-eyebrow">04 — About</div>
        <h3 class="section-title">The Majlis</h3>
        <p class="section-sub">Project tracker for the atelier.</p>

        <div class="about-list">
          <div class="about-row"><span>Version</span><span>0.1.0 · POC</span></div>
          <div class="about-row"><span>Build</span><span>Vue 3 · Vite</span></div>
          <div class="about-row"><span>Status</span><span>Visual prototype</span></div>
        </div>

        <p class="about-note">
          This workspace is a visual proof of concept. Data resets on each reload.
        </p>
      </section>

      <div class="actions">
        <button class="btn-secondary">Cancel</button>
        <button class="btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-head {
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

.settings-shell {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 24px;
  align-items: start;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius-lg);
  padding: 8px;
}

.side-nav button {
  background: transparent;
  border: none;
  text-align: left;
  padding: 9px 12px;
  font-size: 13px;
  color: var(--m-ink-2);
  border-radius: 4px;
  letter-spacing: 0.02em;
  transition: background 0.12s, color 0.12s;
}

.side-nav button:hover {
  background: var(--m-paper-2);
  color: var(--m-ink);
}

.side-nav button.active {
  background: var(--m-ink);
  color: var(--m-paper);
}

.panel {
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius-lg);
  padding: 28px 30px;
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
  margin-bottom: 6px;
}

.section-sub {
  color: var(--m-ink-3);
  font-size: 13px;
  margin: 0 0 24px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 8px;
}

.field-label {
  font-size: 12px;
  letter-spacing: 0.04em;
  color: var(--m-ink-3);
  margin-bottom: 6px;
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

.toggle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 0.5px solid var(--m-line-soft);
  gap: 24px;
}

.toggle-row:first-of-type {
  margin-top: 12px;
}

.toggle-label {
  font-size: 14px;
  color: var(--m-ink);
  margin-bottom: 2px;
}

.toggle-hint {
  font-size: 12px;
  color: var(--m-ink-3);
}

.toggle {
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: var(--m-cream-2);
  border: 0.5px solid var(--m-line);
  position: relative;
  padding: 0;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  flex-shrink: 0;
}

.toggle.on {
  background: var(--m-ink);
  border-color: var(--m-ink);
}

.toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: var(--m-paper);
  border-radius: 50%;
  transition: left 0.15s;
  box-shadow: 0 1px 2px rgba(42, 36, 29, 0.15);
}

.toggle.on .toggle-knob {
  left: 18px;
}

.about-list {
  margin: 18px 0;
}

.about-row {
  display: flex;
  justify-content: space-between;
  padding: 9px 0;
  border-top: 0.5px solid var(--m-line-soft);
  font-size: 13px;
}

.about-row:first-child {
  border-top: none;
}

.about-row > span:first-child {
  color: var(--m-ink-3);
}

.about-row > span:last-child {
  color: var(--m-ink);
}

.about-note {
  margin-top: 18px;
  font-size: 12px;
  color: var(--m-ink-3);
  font-style: italic;
  padding: 12px 14px;
  background: var(--m-paper-2);
  border-radius: var(--radius);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  padding-top: 22px;
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
  background: var(--m-paper-2);
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

.btn-primary:hover {
  opacity: 0.9;
}
</style>
