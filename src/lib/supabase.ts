import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  first_name: string
  last_name: string
  full_name: string
  role: 'admin' | 'agent'
  initials: string
  color: string
  active: boolean
  comm_pct_agency: number
  comm_pct_agent: number
  created_at: string
  phone: string | null
  display_email: string | null
  personal_address: string | null
  codice_fiscale: string | null
  iban: string | null
  contract_start_date: string | null
  contract_type: string | null
  profile_notes: string | null
}

export type Client = {
  id: string
  first_name: string
  last_name: string
  name: string
  phone: string | null
  email: string | null
  type: 'acquirente' | 'venditore' | 'entrambi'
  address: string | null
  notes: string | null
  birth_date: string | null
  company: string | null
  source: string | null
  linked_agent_id: string | null
  date_added: string
  updated_at: string
}

export type AnnualBudget = {
  id: string
  year: number
  total_target: number
  created_at: string
  updated_at: string
}

export type AgentBudgetAllocation = {
  id: string
  budget_id: string
  agent_id: string
  allocated_target: number
  created_at: string
}

export type Operation = {
  id: string
  agent_id: string
  property_name: string
  address: string | null
  type: 'vendita' | 'locazione'
  status: 'pipeline' | 'completata'
  origin: 'agente' | 'agenzia' | 'valutazione'
  property_value: number | null
  comm_pct_seller: number
  comm_pct_buyer: number
  sale_date: string | null
  final_value: number | null
  gross_commission: number | null
  agent_commission: number | null
  notes: string | null
  date_added: string
  updated_at: string
  // Acquirente
  buyer_first_name: string | null
  buyer_last_name: string | null
  buyer_name: string | null
  // Collaboratore
  collaborator_id: string | null
  collaborator_first_name: string | null
  collaborator_last_name: string | null
  collaborator_name: string | null
  collaborator_comm_pct: number
  collaborator_commission: number | null
  // Modalità commissioni (pct o fixed)
  comm_mode_seller: 'pct' | 'fixed'
  comm_mode_buyer: 'pct' | 'fixed'
  comm_fixed_seller: number
  comm_fixed_buyer: number
  // Provvigioni incassate
  commission_collected: number | null
  collection_date: string | null
  // Date incarico
  mandate_start_date: string | null
  mandate_end_date: string | null
  // Probabilità vendita
  sale_probability: 30 | 60 | 90 | null
  // Cliente associato
  client_id: string | null
  // Pubblicazione sito
  publish_to_website: boolean
}

export type ClientProperty = {
  id: string
  client_id: string
  property_name: string
  address: string | null
  property_value: number | null
  status: 'venduto_nostra' | 'venduto_altri' | 'in_vendita_altri' | 'non_in_vendita' | 'tracciato'
  agency_name: string | null
  notes: string | null
  operation_id: string | null
  created_at: string
  updated_at: string
}

export type Valutazione = {
  id: string
  agent_id: string
  owner_name: string
  address: string
  estimated_price: number | null
  acquisition_probability: '15_giorni' | '3_mesi' | '6_mesi' | null
  notes: string | null
  valuation_date: string
  incarico_preso: boolean
  incarico_date: string | null
  operation_id: string | null
  origin: 'agente' | 'agenzia'
  valuation_delivered: boolean
  created_at: string
  updated_at: string
}

export type ValutazioneWithAgent = Valutazione & {
  profiles?: Profile
}

export type OperationWithAgent = Operation & {
  profiles?: Profile
}
