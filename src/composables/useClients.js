import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const clients = ref([])
const loading = ref(false)
const error = ref(null)

async function load() {
  loading.value = true
  error.value = null
  const { data, error: err } = await supabase
    .from('clients')
    .select('*')
    .eq('archived', false)
    .order('name', { ascending: true })
  if (err) error.value = err
  else clients.value = data || []
  loading.value = false
}

async function createClient(payload) {
  const { data, error: err } = await supabase
    .from('clients')
    .insert(payload)
    .select('*')
    .single()
  if (err) throw err
  await load()
  return data
}

async function updateClient(id, patch) {
  const { data, error: err } = await supabase
    .from('clients')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()
  if (err) throw err
  await load()
  return data
}

async function archiveClient(id) {
  return updateClient(id, { archived: true })
}

async function restoreClient(id) {
  return updateClient(id, { archived: false })
}

async function deleteClient(id) {
  const { error: err } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  if (err) throw err
  await load()
}

async function loadArchived() {
  const { data, error: err } = await supabase
    .from('clients')
    .select('*')
    .eq('archived', true)
    .order('name', { ascending: true })
  if (err) throw err
  return data || []
}

export function useClients() {
  return {
    clients,
    loading,
    error,
    load,
    createClient,
    updateClient,
    archiveClient,
    restoreClient,
    deleteClient,
    loadArchived
  }
}
