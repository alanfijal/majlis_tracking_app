<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="detail-shell">
    <button class="back" @click="router.push({ name: 'projects' })">← Back to projects</button>
    <div class="eyebrow">Project</div>
    <h2 class="title">Project detail — coming soon</h2>
    <p class="sub">This view is a placeholder. Detailed project information will land in a future release.</p>
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

.title {
  font-size: 32px;
  letter-spacing: 0.02em;
  margin-bottom: 10px;
}

.sub {
  color: var(--m-ink-3);
  font-size: 14px;
  margin: 0;
}
</style>
