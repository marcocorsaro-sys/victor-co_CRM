-- Victor&Co CRM - Seed Data
-- NOTA: Gli utenti devono essere creati prima tramite Supabase Auth (Dashboard o API)
-- Questo file assume che i seguenti utenti siano già stati creati in auth.users:
--
-- 1. victor@victorco.it   / Admin2024!   (admin)
-- 2. roberto@victorco.it  / Agent2024!   (agente)
-- 3. roland@victorco.it   / Agent2024!   (agente)
-- 4. federico@victorco.it / Agent2024!   (agente)
--
-- Dopo aver creato gli utenti in Supabase Auth, sostituisci gli UUID qui sotto
-- con quelli generati da Supabase.

-- PLACEHOLDER UUIDs (sostituire con quelli reali)
-- victor:   11111111-1111-1111-1111-111111111111
-- roberto:  22222222-2222-2222-2222-222222222222
-- roland:   33333333-3333-3333-3333-333333333333
-- federico: 44444444-4444-4444-4444-444444444444

-- Profili
INSERT INTO profiles (id, full_name, role, initials, color, comm_pct_agency, comm_pct_agent) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Victor Corsaro',   'admin', 'VC', '#c8e64a', 0, 0),
  ('22222222-2222-2222-2222-222222222222', 'Roberto Bianchi',  'agent', 'RB', '#3b82f6', 20.00, 50.00),
  ('33333333-3333-3333-3333-333333333333', 'Roland Rossi',     'agent', 'RR', '#8b5cf6', 20.00, 50.00),
  ('44444444-4444-4444-4444-444444444444', 'Federico Verdi',   'agent', 'FV', '#f97316', 25.00, 45.00);

-- Operazioni (distribuite negli ultimi 12 mesi)
-- Nota: le date partono da aprile 2025 (fondazione) a marzo 2026

-- Roberto - Operazioni completate
INSERT INTO operations (agent_id, property_name, address, type, status, origin, property_value, comm_pct_seller, comm_pct_buyer, sale_date, final_value, gross_commission, agent_commission, date_added) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Trilocale Via Negroni 14', 'Via Negroni 14, Novara', 'vendita', 'completata', 'agenzia', 185000, 3.00, 3.00, '2025-05-15', 180000, 10800, 2160, '2025-04-20'),
  ('22222222-2222-2222-2222-222222222222', 'Bilocale Corso Cavallotti', 'Corso Cavallotti 88, Novara', 'vendita', 'completata', 'agente', 145000, 3.00, 3.00, '2025-07-22', 142000, 8520, 4260, '2025-06-10'),
  ('22222222-2222-2222-2222-222222222222', 'Appartamento Via Tornielli', 'Via Tornielli 5, Novara', 'locazione', 'completata', 'agenzia', 850, 100.00, 0.00, '2025-09-01', 850, 850, 170, '2025-08-15'),
  ('22222222-2222-2222-2222-222222222222', 'Villa Viale Volta', 'Viale Volta 32, Novara', 'vendita', 'completata', 'agente', 320000, 2.50, 3.00, '2025-11-10', 315000, 17325, 8662.50, '2025-10-01'),
  ('22222222-2222-2222-2222-222222222222', 'Monolocale Via Rosselli', 'Via Rosselli 7, Novara', 'vendita', 'completata', 'agenzia', 95000, 3.00, 3.00, '2026-01-18', 93000, 5580, 1116, '2025-12-05'),
  ('22222222-2222-2222-2222-222222222222', 'Ufficio Piazza Gramsci', 'Piazza Gramsci 3, Novara', 'locazione', 'completata', 'agente', 1200, 100.00, 0.00, '2026-02-15', 1200, 1200, 600, '2026-01-20');

-- Roberto - Pipeline
INSERT INTO operations (agent_id, property_name, address, type, status, origin, property_value, comm_pct_seller, comm_pct_buyer, date_added) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Attico Corso Italia', 'Corso Italia 15, Novara', 'vendita', 'pipeline', 'agente', 450000, 3.00, 3.00, '2026-02-28'),
  ('22222222-2222-2222-2222-222222222222', 'Negozio Via San Francesco', 'Via San Francesco 22, Novara', 'locazione', 'pipeline', 'agenzia', 2500, 100.00, 0.00, '2026-03-01');

-- Roland - Operazioni completate
INSERT INTO operations (agent_id, property_name, address, type, status, origin, property_value, comm_pct_seller, comm_pct_buyer, sale_date, final_value, gross_commission, agent_commission, date_added) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Quadrilocale Via Mossotti', 'Via Mossotti 11, Novara', 'vendita', 'completata', 'agente', 265000, 3.00, 3.00, '2025-06-20', 260000, 15600, 7800, '2025-05-10'),
  ('33333333-3333-3333-3333-333333333333', 'Bilocale Via Fratelli Rosselli', 'Via F. Rosselli 18, Novara', 'vendita', 'completata', 'agenzia', 130000, 3.00, 3.00, '2025-08-30', 128000, 7680, 1536, '2025-07-15'),
  ('33333333-3333-3333-3333-333333333333', 'Loft Via Ravizza', 'Via Ravizza 4, Novara', 'vendita', 'completata', 'agente', 210000, 2.50, 2.50, '2025-10-25', 205000, 10250, 5125, '2025-09-20'),
  ('33333333-3333-3333-3333-333333333333', 'Appartamento Baluardo Lamarmora', 'Baluardo Lamarmora 9, Novara', 'locazione', 'completata', 'agenzia', 950, 100.00, 0.00, '2025-12-01', 950, 950, 190, '2025-11-10'),
  ('33333333-3333-3333-3333-333333333333', 'Trilocale Via Monte Rosa', 'Via Monte Rosa 20, Novara', 'vendita', 'completata', 'agenzia', 175000, 3.00, 3.00, '2026-02-10', 172000, 10320, 2064, '2026-01-05'),
  ('33333333-3333-3333-3333-333333333333', 'Rustico Strada Biandrate', 'Strada Biandrate km 3, Novara', 'vendita', 'completata', 'agente', 380000, 3.00, 2.50, '2026-03-05', 375000, 20625, 10312.50, '2026-02-01');

-- Roland - Pipeline
INSERT INTO operations (agent_id, property_name, address, type, status, origin, property_value, comm_pct_seller, comm_pct_buyer, date_added) VALUES
  ('33333333-3333-3333-3333-333333333333', 'Villetta Via Puccini', 'Via Puccini 8, Novara', 'vendita', 'pipeline', 'agenzia', 290000, 3.00, 3.00, '2026-03-10');

-- Federico - Operazioni completate
INSERT INTO operations (agent_id, property_name, address, type, status, origin, property_value, comm_pct_seller, comm_pct_buyer, sale_date, final_value, gross_commission, agent_commission, date_added) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Penthouse Corso Cavour', 'Corso Cavour 45, Novara', 'vendita', 'completata', 'agente', 520000, 3.00, 3.00, '2025-06-05', 510000, 30600, 13770, '2025-05-01'),
  ('44444444-4444-4444-4444-444444444444', 'Bilocale Via Dante', 'Via Dante 33, Novara', 'vendita', 'completata', 'agenzia', 115000, 3.00, 3.00, '2025-08-12', 112000, 6720, 1680, '2025-07-20'),
  ('44444444-4444-4444-4444-444444444444', 'Box Auto Via Sforzesca', 'Via Sforzesca 2, Novara', 'vendita', 'completata', 'agenzia', 28000, 3.00, 3.00, '2025-10-05', 27000, 1620, 405, '2025-09-15'),
  ('44444444-4444-4444-4444-444444444444', 'Locale Commerciale Corso Garibaldi', 'Corso Garibaldi 60, Novara', 'locazione', 'completata', 'agente', 1800, 100.00, 0.00, '2025-12-20', 1800, 1800, 810, '2025-11-25'),
  ('44444444-4444-4444-4444-444444444444', 'Trilocale Via Verdi', 'Via Verdi 14, Novara', 'vendita', 'completata', 'agente', 198000, 3.00, 3.00, '2026-01-28', 195000, 11700, 5265, '2025-12-20'),
  ('44444444-4444-4444-4444-444444444444', 'Appartamento Via Morera', 'Via Morera 6, Novara', 'vendita', 'completata', 'agenzia', 160000, 3.00, 3.00, '2026-03-01', 158000, 9480, 2370, '2026-02-10');

-- Federico - Pipeline
INSERT INTO operations (agent_id, property_name, address, type, status, origin, property_value, comm_pct_seller, comm_pct_buyer, date_added) VALUES
  ('44444444-4444-4444-4444-444444444444', 'Villa Bifamiliare Viale Kennedy', 'Viale Kennedy 55, Novara', 'vendita', 'pipeline', 'agente', 380000, 3.00, 3.00, '2026-02-15'),
  ('44444444-4444-4444-4444-444444444444', 'Magazzino Via Industry', 'Via Industry 12, Novara', 'locazione', 'pipeline', 'agenzia', 3500, 100.00, 0.00, '2026-03-05'),
  ('44444444-4444-4444-4444-444444444444', 'Bilocale Piazza Duomo', 'Piazza Duomo 2, Novara', 'vendita', 'pipeline', 'agenzia', 220000, 3.00, 3.00, '2026-03-12');
