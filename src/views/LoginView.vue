<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const loading = ref(false)
const errorMsg = ref(null)

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const err =
    params.get('error_description') ||
    params.get('error') ||
    hash.get('error_description') ||
    hash.get('error')
  if (err) errorMsg.value = decodeURIComponent(err.replace(/\+/g, ' '))
})

async function signIn() {
  loading.value = true
  errorMsg.value = null
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  if (error) {
    errorMsg.value = error.message
    loading.value = false
  }
}
</script>

<template>
  <div class="login-shell">
    <div class="login-card">
      <div class="eyebrow">Atelier · Marbella</div>
      <h1 class="brand">The Majlis</h1>
      <p class="subtitle">Project tracker — please sign in</p>

      <button class="signin" :disabled="loading" @click="signIn">
        {{ loading ? 'Redirecting…' : 'Continue with Google' }}
      </button>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 360px;
  text-align: center;
  background: var(--m-paper);
  border: 0.5px solid var(--m-line-soft);
  border-radius: var(--radius-lg);
  padding: 44px 36px 38px;
}

.eyebrow {
  font-size: 11px;
  color: var(--m-ink-3);
  letter-spacing: 0.18em;
  margin-bottom: 10px;
  text-transform: uppercase;
}

.brand {
  font-family: var(--font-display);
  font-size: 36px;
  letter-spacing: 0.04em;
  margin: 0 0 10px;
  color: var(--m-ink);
}

.subtitle {
  font-size: 13px;
  color: var(--m-ink-3);
  margin: 0 0 28px;
  letter-spacing: 0.02em;
}

.signin {
  background: var(--m-ink);
  color: var(--m-paper);
  border: none;
  border-radius: var(--radius);
  padding: 11px 20px;
  font-size: 13px;
  letter-spacing: 0.02em;
  width: 100%;
  transition: opacity 0.15s;
  font-family: inherit;
}

.signin:hover:not(:disabled) {
  opacity: 0.88;
}

.signin:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  margin: 16px 0 0;
  font-size: 12px;
  color: var(--m-status-snagg-fg);
  letter-spacing: 0.02em;
}
</style>
