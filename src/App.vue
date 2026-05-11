<script setup>
import { ref } from 'vue'
import ProjectsView from './components/ProjectsView.vue'
import ProjectFormView from './components/ProjectFormView.vue'
import ClientsView from './components/ClientsView.vue'
import CalendarView from './components/CalendarView.vue'
import SettingsView from './components/SettingsView.vue'

const view = ref('projects')
const showForm = ref(false)

function openForm() {
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

function handleSave(project) {
  console.log('Saved project:', project)
  closeForm()
}

function setView(v) {
  view.value = v
  showForm.value = false
}
</script>

<template>
  <header class="app-header">
    <div>
      <div class="app-sub">Atelier · Marbella</div>
      <h1 class="app-brand">The Majlis</h1>
    </div>
    <nav class="app-nav">
      <a :class="{ active: view === 'projects' && !showForm }" @click="setView('projects')">Projects</a>
      <a :class="{ active: view === 'clients' && !showForm }" @click="setView('clients')">Clients</a>
      <a :class="{ active: view === 'calendar' && !showForm }" @click="setView('calendar')">Calendar</a>
      <a :class="{ active: view === 'settings' && !showForm }" @click="setView('settings')">Settings</a>
    </nav>
  </header>

  <main>
    <ProjectFormView v-if="showForm" @cancel="closeForm" @save="handleSave" />
    <ProjectsView v-else-if="view === 'projects'" @new-project="openForm" />
    <ClientsView v-else-if="view === 'clients'" />
    <CalendarView v-else-if="view === 'calendar'" />
    <SettingsView v-else-if="view === 'settings'" />
  </main>

  <footer class="app-footer">
    Visual POC · The Majlis project tracker
  </footer>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  border-bottom: 0.5px solid var(--m-line);
  padding-bottom: 22px;
  margin-bottom: 28px;
}

.app-sub {
  font-size: 11px;
  color: var(--m-ink-3);
  letter-spacing: 0.18em;
  margin-bottom: 6px;
}

.app-brand {
  font-size: 32px;
  letter-spacing: 0.04em;
}

.app-nav {
  display: flex;
  gap: 24px;
  font-size: 14px;
}

.app-nav a {
  color: var(--m-ink-3);
  cursor: pointer;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.app-nav a:hover {
  color: var(--m-ink);
}

.app-nav a.active {
  color: var(--m-ink);
  border-bottom-color: var(--m-brass);
}

.app-footer {
  margin-top: 56px;
  padding-top: 20px;
  border-top: 0.5px solid var(--m-line-soft);
  font-size: 11px;
  color: var(--m-ink-3);
  text-align: center;
  letter-spacing: 0.06em;
}
</style>
