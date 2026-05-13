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
    .from('projects')
    .insert(payload)
    .select('*, client:clients(*)')
    .single()
  if (err) throw err
  await load()
  return data
}

async function updateProject(id, patch) {
  const { data, error: err } = await supabase
    .from('projects')
    .update(patch)
    .eq('id', id)
    .select('*, client:clients(*)')
    .single()
  if (err) throw err
  await load()
  return data
}

async function archiveProject(id) {
  return updateProject(id, { archived: true })
}

async function restoreProject(id) {
  return updateProject(id, { archived: false })
}

async function deleteProject(id) {
  const { error: err } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  if (err) throw err
  await load()
}

async function loadArchived() {
  const { data, error: err } = await supabase
    .from('projects')
    .select('*, client:clients(*)')
    .eq('archived', true)
    .order('updated_at', { ascending: false })
  if (err) throw err
  return data || []
}

export function useProjects() {
  return {
    projects,
    loading,
    error,
    load,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    loadArchived
  }
}
