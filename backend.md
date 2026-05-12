# Backend integration task

Wire the existing Vue 3 + Vite frontend up to a Supabase backend (Postgres + Auth). The current app uses mock data from `src/data.js`. Replace that with real Supabase queries, add Google OAuth login, and have the app actually persist data.

## Stack context

- Frontend: Vite + Vue 3 (composition API, `<script setup>`), vanilla CSS
- Backend: Supabase (Postgres + GoTrue Auth)
- Key existing files: `src/App.vue`, `src/data.js`, `src/components/ProjectsView.vue`, `src/components/ProjectFormView.vue`, `src/styles.css`

Read the existing components first to understand the current data shapes, props, and events. Match those shapes — do not rewrite the UI.

## Prerequisites (user must have done these)

1. Created a Supabase project, has the URL and anon key
2. Run the schema SQL below in Supabase SQL Editor
3. Set up Google OAuth provider in Supabase Auth → Providers (Client ID + Secret from Google Cloud Console)
4. Set redirect URLs in Supabase Auth → URL Configuration: `http://localhost:5173` (and any production URL when deployed)
5. Disabled email signups under Supabase Auth → Settings (Google-only access)

If any of these are missing, stop and surface what's needed before writing code.

## Reference: database schema

This is what was provisioned in Supabase. Do not re-run it — it's reference for the data shape the composables must match.

```sql
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  language text not null default 'EN',
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  name text not null,
  location text,
  budget numeric(12,2),
  currency text not null default 'EUR',
  language text,
  status text not null default 'new' check (status in ('new','sales','ongoing','snag')),
  start_date date,
  expected_end_date date,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on projects(client_id);
create index projects_status_idx on projects(status) where archived = false;

alter table clients enable row level security;
alter table projects enable row level security;

create policy "auth full access clients" on clients
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "auth full access projects" on projects
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

## What to build, in order

### 1. Install dependencies

```bash
npm install @supabase/supabase-js vue-router
```

### 2. Environment variables

Create `.env.local` (not committed) with:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Create `.env.example` (committed) with the same keys but empty values. Confirm `.env.local` is in `.gitignore`.

### 3. Supabase client

Create `src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check .env.local')
}

export const supabase = createClient(url, key)
```

### 4. Move static option lists out of data.js

Keep `statusOptions`, `languageOptions`, `currencyOptions` — they are UI option lists, not data. Move them to `src/lib/options.js` (same exports, same shapes).

Then delete (or rename to `src/data.mock.js` if you want it as reference) the rest of `src/data.js`. All consumers of `clients` / `projects` must move to the composables below.

### 5. Composables

Create `src/composables/useProjects.js`. Module-scoped state so all components share one source of truth:

```js
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const projects = ref([])
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  const { data, error: err } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (err) error.value = err
  else projects.value = data || []
  loading.value = false
}

async function createProject(payload) {
  const { data, error: err } = await supabase
    .from('projects').insert(payload).select('*, client:clients(*)').single()
  if (err) throw err
  await load()
  return data
}

async function updateProject(id, patch) {
  const { data, error: err } = await supabase
    .from('projects').update(patch).eq('id', id).select('*, client:clients(*)').single()
  if (err) throw err
  await load()
  return data
}

async function archiveProject(id) {
  return updateProject(id, { archived: true })
}

export function useProjects() {
  return { projects, loading, error, load, createProject, updateProject, archiveProject }
}
```

Create `src/composables/useClients.js` with the same pattern: a module-scoped `clients` ref, `load()`, `createClient(payload)`, `updateClient(id, patch)`, `archiveClient(id)`. Use a different local name when importing Supabase's `createClient` to avoid the naming clash — e.g. `import { createClient as createSupabaseClient } from '@supabase/supabase-js'` is only used inside `lib/supabase.js`, so in the composable you only need to name the exported function carefully (e.g. `createClient` is fine since you're not importing Supabase's directly here).

### 6. Vue Router

Create `src/router/index.js`:

```js
import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/', name: 'projects', component: () => import('../components/ProjectsView.vue') },
    { path: '/projects/new', name: 'project-new', component: () => import('../components/ProjectFormView.vue') },
    { path: '/projects/:id', name: 'project-detail', component: () => import('../views/ProjectDetailView.vue') }
  ]
})

router.beforeEach(async (to) => {
  const { data } = await supabase.auth.getSession()
  if (!data.session && to.name !== 'login') return { name: 'login' }
  if (data.session && to.name === 'login') return { name: 'projects' }
})

export default router
```

Create a placeholder `src/views/ProjectDetailView.vue` that just renders "Project detail — coming soon" using the existing styles. The route needs to resolve even if the view is a stub.

Update `src/main.js`:

```js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'

createApp(App).use(router).mount('#app')
```

### 7. LoginView.vue

Create `src/views/LoginView.vue` matching the Majlis aesthetic. Read `src/styles.css` for the available CSS variables (`--m-cream`, `--m-paper`, `--m-ink`, `--m-brass`, `--font-display`, etc.).

Layout:
- Centered vertically and horizontally on the page (use `min-height: 100vh` and flex)
- Small uppercase eyebrow "Atelier · Marbella" (use existing `.app-sub` style as reference)
- "The Majlis" wordmark in serif at ~36px
- A short subtitle: "Project tracker — please sign in"
- A single button "Continue with Google" using the same look as the existing primary button (dark ink background, paper text)
- An error message slot below the button (hidden until set)

Button behaviour:

```js
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
```

### 8. App.vue updates

Modify `src/App.vue` to:
- Replace the conditional rendering of views with `<router-view />`
- Add a session ref initialised in `onMounted` via `supabase.auth.getSession()`
- Subscribe to `supabase.auth.onAuthStateChange((event, session) => { ... })` to keep the ref in sync; unsubscribe in `onUnmounted`
- Hide the header/nav entirely when on the `/login` route (`useRoute().name === 'login'`)
- Add a "Sign out" link in the nav, calling `supabase.auth.signOut()` then `router.push({ name: 'login' })`
- Convert nav clicks to use `router.push` (or `<router-link>`) so URLs reflect the active view

### 9. Wire ProjectsView

Modify `src/components/ProjectsView.vue`:
- Replace the mock-data import with `import { useProjects } from '../composables/useProjects'` (and `useClients` if it references clients independently)
- Call `load()` in `onMounted`
- Render a subtle loading state when `loading.value` is true (an inline italic line of text in the brass colour is fine — don't add spinners)
- Render the error if set, also inline
- Adapt data access — since the query joins clients, each project has a nested `client` object. Read `p.client.name` directly, no separate lookup function needed
- "+ New project" button calls `router.push({ name: 'project-new' })` instead of emitting `new-project`
- Add refresh-on-visibility:

```js
function onVisible() {
  if (document.visibilityState === 'visible') load()
}
onMounted(() => {
  load()
  document.addEventListener('visibilitychange', onVisible)
})
onUnmounted(() => document.removeEventListener('visibilitychange', onVisible))
```

### 10. Wire ProjectFormView

Modify `src/components/ProjectFormView.vue`:
- Import both composables and `useRouter`
- Add `saving` and `saveError` refs
- Replace `handleSave` with the async version below
- Disable the save button while `saving.value` is true; show `saveError.value` below the action row if set
- Cancel/Back buttons call `router.push({ name: 'projects' })` instead of emitting events

```js
async function handleSave() {
  if (!isValid.value) return
  saving.value = true
  saveError.value = null
  try {
    const { createClient: createClientFn } = useClients()
    const { createProject } = useProjects()

    let clientId = selectedClientId.value
    if (clientMode.value === 'new') {
      const created = await createClientFn({
        name: newClient.value.name.trim(),
        email: newClient.value.email.trim() || null,
        phone: newClient.value.phone.trim() || null,
        language: newClient.value.language
      })
      clientId = created.id
    }

    await createProject({
      client_id: clientId,
      name: projectName.value.trim(),
      location: location.value.trim() || null,
      budget: Number(budget.value),
      currency: currency.value,
      language: language.value,
      status: status.value,
      start_date: startDate.value || null,
      expected_end_date: endDate.value || null,
      notes: notes.value.trim() || null
    })

    router.push({ name: 'projects' })
  } catch (e) {
    saveError.value = e.message || 'Failed to save. Try again.'
  } finally {
    saving.value = false
  }
}
```

## Expected file structure when done

```
src/
├── App.vue                              UPDATED  router-view + session
├── main.js                              UPDATED  registers router
├── styles.css                           unchanged
├── lib/
│   ├── supabase.js                      NEW
│   └── options.js                       NEW  (statusOptions etc moved here)
├── composables/
│   ├── useProjects.js                   NEW
│   └── useClients.js                    NEW
├── router/
│   └── index.js                         NEW
├── views/
│   ├── LoginView.vue                    NEW
│   └── ProjectDetailView.vue            NEW  (stub)
└── components/
    ├── ProjectsView.vue                 UPDATED
    └── ProjectFormView.vue              UPDATED
```

## Do not do these

- Do not change the visual styling, theme tokens, layout, or any existing CSS variable. Preserve the Majlis aesthetic exactly as it is.
- Do not install Pinia, Vuex, or any state management library. The module-scoped ref pattern in composables is intentional.
- Do not add TypeScript. The project is plain JS, keep it that way.
- Do not add Tailwind or any CSS framework.
- Do not add toast libraries, error boundary components, or notification systems. Use simple inline error states.
- Do not add tests in this pass — wire it up working first.
- Do not commit `.env.local`.
- Do not add real-time subscriptions, file uploads, or audit logging. All explicitly deferred.
- Do not refactor existing component internals beyond what's needed to swap the data source and add routing.

## Verification checklist

When done, all of these should be true:

- [ ] `npm run dev` starts cleanly with no console errors
- [ ] Unauthenticated visit to `/` redirects to `/login`
- [ ] "Continue with Google" launches the Google consent flow and returns to `/`
- [ ] The projects table loads from Supabase (will be empty initially — that's correct)
- [ ] "+ New project" navigates to `/projects/new` (URL changes)
- [ ] Creating a project with an existing client persists and appears in the table on return
- [ ] Creating a project with a new client creates both rows correctly linked
- [ ] Switching browser tabs and returning refreshes the projects list
- [ ] "Sign out" returns to `/login`
- [ ] No references to `src/data.js` remain anywhere in the codebase

## Gotchas worth knowing

- The Supabase JS client's `.single()` throws if zero or more than one row matches. Always pair it with `.select()` after `.insert()`/`.update()` so you actually get the new row back.
- Payloads use snake_case to match Postgres columns (`client_id`, `start_date`, `expected_end_date`). The form fields are camelCase. Map between them explicitly in `handleSave` — don't try to spread the form object directly.
- With `.select('*, client:clients(*)')`, Supabase returns the joined client nested as `project.client`. Any existing code that derives `clientName` from a lookup function should be removed in favor of `p.client.name`.
- The form's communication language should still default to the selected client's preferred language when a client is picked. Keep that behavior — read `selectedClient.value.language` after selection.
- On the OAuth redirect from Google, Supabase parses the URL fragment automatically. No callback route is needed.
- `supabase.auth.signOut()` should be awaited before calling `router.push({ name: 'login' })`. Otherwise the auth state listener can briefly think the user is still signed in and bounce them back.
- If RLS rejects a query, Supabase returns an empty result with no error rather than a 403. If `projects.value` is empty after `load()` and the schema is correct, double-check the RLS policies and that the user is authenticated.

## After this task

Things deliberately deferred for a future task:
- Project detail view (the stub is a placeholder)
- Photo uploads via Supabase Storage
- Real-time updates via Supabase channels
- Audit log (`project_status_history` table + trigger)
- FastAPI sidecar for agentic features
- Vercel deployment with custom domain

Each of those is its own focused task and shouldn't be smuggled into this one.