-- Victor&Co CRM - Database Schema
-- Run this in Supabase SQL Editor

-- Profili utente (estende auth.users di Supabase)
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  role         TEXT NOT NULL CHECK (role IN ('admin', 'agent')),
  initials     TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#c8e64a',
  active       BOOLEAN NOT NULL DEFAULT true,
  -- Percentuali provvigione agente (configurate dall'admin)
  comm_pct_agency  NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  comm_pct_agent   NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Operazioni immobiliari
CREATE TABLE operations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         UUID NOT NULL REFERENCES profiles(id),
  property_name    TEXT NOT NULL,
  address          TEXT,
  type             TEXT NOT NULL CHECK (type IN ('vendita', 'locazione')),
  status           TEXT NOT NULL CHECK (status IN ('pipeline', 'completata')) DEFAULT 'pipeline',
  origin           TEXT NOT NULL CHECK (origin IN ('agente', 'agenzia')),

  -- Valore immobile
  property_value   NUMERIC(12,2),

  -- Commissioni (in percentuale, modificabili per ogni operazione)
  comm_pct_seller  NUMERIC(5,2) NOT NULL DEFAULT 3.00,
  comm_pct_buyer   NUMERIC(5,2) NOT NULL DEFAULT 3.00,

  -- Campi valorizzati alla chiusura
  sale_date        DATE,
  final_value      NUMERIC(12,2),

  -- Commissioni calcolate (valorizzate alla chiusura, storicizzate)
  gross_commission     NUMERIC(12,2),
  agent_commission     NUMERIC(12,2),

  notes            TEXT,
  date_added       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;

-- Security definer function to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$;

-- Admin vede tutto, agente vede solo le sue
CREATE POLICY "admin_all_profiles"
  ON profiles
  FOR ALL USING (
    public.get_user_role(auth.uid()) = 'admin'
  );
CREATE POLICY "agent_own_profile"
  ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "admin_all_ops"
  ON operations FOR ALL USING (
    public.get_user_role(auth.uid()) = 'admin'
  );
CREATE POLICY "agent_own_ops"
  ON operations FOR ALL USING (agent_id = auth.uid());

-- Enable realtime for operations table
ALTER PUBLICATION supabase_realtime ADD TABLE operations;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER operations_updated_at
  BEFORE UPDATE ON operations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
