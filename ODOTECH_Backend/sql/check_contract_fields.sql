-- Quick check if contract fields exist
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'accounts' 
  AND column_name IN ('contract_start', 'contract_end', 'contract_type', 'renewal_history')
ORDER BY column_name;
