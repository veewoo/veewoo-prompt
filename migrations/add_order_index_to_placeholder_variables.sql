-- Migration: Add order_index column to placeholder_variables table
-- This allows storing the order of placeholder variables for each prompt

-- Add the order_index column
ALTER TABLE placeholder_variables 
ADD COLUMN order_index INTEGER DEFAULT 0;

-- Create an index for better query performance when ordering
CREATE INDEX idx_placeholder_variables_prompt_order 
ON placeholder_variables(prompt_id, order_index);

-- Update existing records to have sequential order_index values
-- This ensures existing data has proper ordering
UPDATE placeholder_variables 
SET order_index = subquery.row_number - 1
FROM (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY prompt_id ORDER BY created_at) as row_number
  FROM placeholder_variables
) AS subquery
WHERE placeholder_variables.id = subquery.id;

-- Add a comment to document the column
COMMENT ON COLUMN placeholder_variables.order_index IS 'Order index for sorting placeholder variables within a prompt (0-based)';
