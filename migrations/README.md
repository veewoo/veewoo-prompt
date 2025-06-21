# Database Migration: Add Order Index to Placeholder Variables

This migration adds support for ordering placeholder variables within prompts.

## What's Added

1. **order_index column**: An integer column to store the order of placeholder variables
2. **Database index**: For efficient ordering queries
3. **Data migration**: Updates existing records with sequential order values

## How to Apply the Migration

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `add_order_index_to_placeholder_variables.sql`
4. Execute the SQL

### Using Supabase CLI
```bash
supabase db reset --linked
# or apply just this migration
supabase migration new add_order_index_to_placeholder_variables
# Copy the SQL content to the generated migration file
supabase db push
```

### Manual Database Connection
If you have direct database access:
```bash
psql "your-connection-string"
\i migrations/add_order_index_to_placeholder_variables.sql
```

## What This Enables

- **Reordering**: Users can now move placeholder variables up and down
- **Persistent Order**: The order is saved to the database and maintained across sessions
- **Consistent Loading**: Variables always load in the same order as saved

## Code Changes Made

1. **Types**: Added `order_index?: number` to PlaceholderVariable interface
2. **Database Types**: Updated Supabase types to include order_index column
3. **Actions**: Modified create/update functions to save order_index
4. **UI**: Added up/down arrow buttons for reordering variables
5. **Queries**: Updated fetch queries to sort by order_index

## Testing the Feature

After applying the migration:

1. Create a new prompt with multiple placeholder variables
2. Use the up/down arrows to reorder them
3. Save the prompt
4. Reload the page or edit the prompt again
5. Verify the order is maintained

The order is 0-based, so the first variable has order_index=0, second has order_index=1, etc.
