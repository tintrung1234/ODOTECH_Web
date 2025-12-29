-- Optional seed data for projects

BEGIN;

INSERT INTO projects (
  project_code,
  project_type,
  name,
  client_id,
  sale_id,
  pm_id,
  status,
  priority,
  budget,
  contract_value,
  actual_cost,
  deposit_received,
  payment_status,
  total_hours,
  technology_stack,
  domain_url,
  production_url,
  start_date,
  deadline,
  completed_at,
  description
) VALUES
(
  'PRJ-0001',
  'Web',
  'ODOTECH Website Revamp',
  1,
  1,
  1,
  'in_progress',
  'high',
  50000,
  75000,
  20000,
  15000,
  'partial',
  320,
  'React, Node.js, PostgreSQL',
  'https://odotech.example',
  'https://app.odotech.example',
  '2025-10-01',
  '2026-01-31',
  NULL,
  'Revamp landing + admin tools'
)
ON CONFLICT (project_code) DO NOTHING;

COMMIT;
