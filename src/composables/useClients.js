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

export function useClients() {
  return { clients, loading, error, load, createClient, updateClient, archiveClient }
}
