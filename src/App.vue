<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from './lib/supabase'

const route = useRoute()
const router = useRouter()
const session = ref(null)

let authSub = null

onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  session.value = data.session
  const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
  })
  authSub = sub
})

onUnmounted(() => {
  authSub?.subscription?.unsubscribe()
})

const showChrome = computed(() => route.name !== 'login' && route.name != null)

async function signOut() {
  await supabase.auth.signOut()
  router.push({ name: 'login' })
}
</script>

<template>
  <header v-if="showChrome" class="app-header">
    <router-link :to="{ name: 'projects' }" class="brand-link" aria-label="The Majlis">
      <img src="/majlis_logo.png" alt="The Majlis" class="brand-logo" />
    </router-link>
    <nav class="app-nav">
      <router-link :to="{ name: 'projects' }">Projects</router-link>
      <router-link :to="{ name: 'clients' }">Clients</router-link>
      <router-link :to="{ name: 'calendar' }">Calendar</router-link>
      <router-link :to="{ name: 'settings' }">Settings</router-link>
      <a v-if="session" class="signout" @click="signOut">Sign out</a>
    </nav>
  </header>

  <main>
    <router-view />
  </main>

  <footer v-if="showChrome" class="app-footer">
    The Majlis project tracker
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

.brand-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.brand-logo {
  height: 76px;
  width: auto;
  display: block;
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

.app-nav a.router-link-exact-active {
  color: var(--m-ink);
  border-bottom-color: var(--m-brass);
}

.app-nav a.signout {
  color: var(--m-ink-3);
}

.app-nav a.signout:hover {
  color: var(--m-ink);
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
