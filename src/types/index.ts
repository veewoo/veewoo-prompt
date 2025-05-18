import { User } from '@supabase/supabase-js';

// Corresponds to the 'tags' table
export interface Tag {
  id: string; // UUID
  name: string;
  created_at?: string;
}

// This is the definition for placeholder variables used by the frontend form and cards.
// The backend actions will map to/from the database structure.
export interface PlaceholderVariable {
  id?: string; // ID from the placeholder_variables table
  name: string;
  type: 'text' | 'option';
  options?: string[]; // For 'option' type, array of option values
}

// Corresponds to the 'prompts' table
export interface Prompt {
  id: string; // UUID
  user_id: string; // Foreign key to auth.users
  title: string;
  prompt_text: string; // Stores the prompt string with placeholders like {{variable_name}}
  tags?: Tag[]; // Populated from prompt_tags junction table
  placeholder_variables?: PlaceholderVariable[]; // Populated from placeholder_variables table and placeholder_variable_options
  created_at?: string;
  updated_at?: string;
}

// For user session
export type SessionUser = User;
