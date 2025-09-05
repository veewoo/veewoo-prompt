// 'use server'; // Removed: No longer a server module

// import { createServerClient, type CookieOptions } from '@supabase/ssr'; // Removed
// import { cookies } from 'next/headers'; // Removed
import { supabase } from '@/lib/supabaseClient';
import { Prompt, Tag, PlaceholderVariable } from '@/types'; // Added PlaceholderVariable
import { Database } from '@/types/supabase'; // Import the Database type
// import { revalidatePath } from 'next/cache'; // Removed: Client-side cannot revalidate

// Removed createServerSupabaseClient function as we'll use the client supabase instance directly

// Helper function to get current user session using the client client
async function getUser() {
  // const supabase = createServerSupabaseClient(); // Removed
  const { data: { user }, error } = await supabase.auth.getUser(); // Uses client supabase
  
  if (error) {
    console.error('[promptActions:getUser] Error from supabase.auth.getUser():', error.message);
  }
  if (!user) {
    console.error('[promptActions:getUser] No user object returned from supabase.auth.getUser(). Session might be invalid or not found on client.');
  }

  if (error || !user) {
    // Consider how to handle this on the client - perhaps redirect to login or show a message
    throw new Error('User not authenticated. Please sign in again.');
  }
  return user;
}

// Define a type for the structure returned by Supabase query for prompt_tags
interface PromptTagFromQuery {
  tags: Tag | null;
}

// Define more specific types for database rows if needed, e.g.:
type DbPlaceholderVariable = Database['public']['Tables']['placeholder_variables']['Row'];
type DbPlaceholderVariableOption = Database['public']['Tables']['placeholder_variable_options']['Row'];

// Helper type for the shape of placeholder variable data returned by Supabase queries
// (including joined relations and assuming order_index column exists)
type PlaceholderVariableFromSupabase = DbPlaceholderVariable & {
  placeholder_variable_options: DbPlaceholderVariableOption[];
  order_index: number | null;
};

// Fetch prompts for the current user using the client client
export async function getPrompts(): Promise<Prompt[]> {
  // const supabase = createServerSupabaseClient(); // Removed
  const user = await getUser(); // Uses client-side getUser

  const { data, error } = await supabase // Uses client supabase
    .from('prompts')
    .select(`
      *,
      prompt_tags ( tags ( id, name ) ),
      placeholder_variables ( *, placeholder_variable_options (id, option_value) )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    throw new Error('Could not fetch prompts.');
  }

  return data.map(p => ({
    ...p,
    tags: p.prompt_tags.map((pt: PromptTagFromQuery) => pt.tags).filter(Boolean) as Tag[],
    placeholder_variables: p.placeholder_variables
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) // Sort by order_index
      .map(pv_raw => {
        const pv = pv_raw as PlaceholderVariableFromSupabase; // Use the specific helper type
        return {
          id: pv.id,
          name: pv.name,
          type: pv.value_type as 'text' | 'option', // Map db 'value_type' to app 'type'
          options: pv.placeholder_variable_options.map(opt => opt.option_value),
          order_index: pv.order_index || 0,
        };
      }) as PlaceholderVariable[],
  })) as Prompt[];
}

// Fetch a single prompt by its ID
export async function getPromptById(promptId: string): Promise<Prompt | null> {
  const user = await getUser(); // Ensures user is authenticated

  const { data, error } = await supabase
    .from('prompts')
    .select(`
      *,
      prompt_tags ( tags ( id, name ) ),
      placeholder_variables ( *, placeholder_variable_options (id, option_value) )
    `)
    .eq('id', promptId)
    .eq('user_id', user.id) // Ensure the user owns the prompt
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // PGRST116: single row not found
      console.warn(`Prompt with id ${promptId} not found or not owned by user.`);
      return null;
    }
    console.error(`Error fetching prompt by id ${promptId}:`, error);
    throw new Error('Could not fetch prompt.');
  }

  if (!data) return null;

  return {
    ...data,
    tags: data.prompt_tags.map((pt: PromptTagFromQuery) => pt.tags).filter(Boolean) as Tag[],
    placeholder_variables: data.placeholder_variables
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) // Sort by order_index
      .map(pv_raw => {
        const pv = pv_raw as PlaceholderVariableFromSupabase; // Use the specific helper type
        return {
          id: pv.id,
          name: pv.name,
          type: pv.value_type as 'text' | 'option', // Map db 'value_type' to app 'type'
          options: pv.placeholder_variable_options.map(opt => opt.option_value),
          order_index: pv.order_index || 0,
        };
      }) as PlaceholderVariable[],
  } as Prompt;
}

// Create a new prompt using the client client
interface CreatePromptArgs {
  prompt_text: string;
  tagNames?: string[];
  placeholder_variables?: PlaceholderVariable[]; // Added placeholder_variables
}

export async function createPrompt(args: CreatePromptArgs): Promise<Prompt> {
  // const supabase = createServerSupabaseClient(); // Removed
  const user = await getUser(); // Uses client-side getUser

  const { data: promptData, error: promptError } = await supabase // Uses client supabase
    .from('prompts')
    .insert({
      user_id: user.id,
      prompt_text: args.prompt_text,
      // placeholder_variables are handled separately below
    })
    .select('*')
    .single();

  if (promptError || !promptData) {
    console.error('Error creating prompt:', promptError);
    throw new Error('Could not create prompt.');
  }

  // TODO: Implement robust tag handling (check existing, create new, link in prompt_tags)
  if (args.tagNames && args.tagNames.length > 0) {
    // Simplified: For each tag name, try to find it or create it, then link to prompt.
    // This needs to be more robust in a production app.
    for (const tagName of args.tagNames) {
      const { data, error } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();

      let tagData = data;
      const tagError = error;

      if (tagError && tagError.code !== 'PGRST116') { // PGRST116: single row not found
        console.error('Error finding tag:', tagError);
        // Optionally continue or throw error
      }

      if (!tagData) {
        const { data: newTag, error: newTagError } = await supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
        if (newTagError) {
          console.error('Error creating new tag:', newTagError);
          continue; // Skip this tag
        }
        tagData = newTag;
      }

      if (tagData) {
        const { error: promptTagError } = await supabase
          .from('prompt_tags')
          .insert({ prompt_id: promptData.id, tag_id: tagData.id });
        if (promptTagError) {
          console.error('Error linking tag to prompt:', promptTagError);
        }
      }
    }
  }

  // Handle Placeholder Variables
  if (args.placeholder_variables && args.placeholder_variables.length > 0) {
    for (let i = 0; i < args.placeholder_variables.length; i++) {
      const pv = args.placeholder_variables[i];
      const { data: pvData, error: pvError } = await supabase
        .from('placeholder_variables')
        .insert({
          prompt_id: promptData.id,
          name: pv.name,
          value_type: pv.type, // Map app 'type' to db 'value_type'
          order_index: i, // Save the order index
          // options are stored in a separate table if type is 'option'
        })
        .select('id') // Select the id of the newly inserted placeholder variable
        .single();

      if (pvError || !pvData) {
        console.error('Error creating placeholder variable:', pvError);
        // Decide if this is a fatal error or if we should continue
        continue; 
      }

      // If the type is 'option' and options are provided, insert them into 'placeholder_variable_options'
      if (pv.type === 'option' && pv.options && pv.options.length > 0) {
        const optionsToInsert = pv.options.map(optionValue => ({
          placeholder_variable_id: pvData.id, // Renamed from variable_id
          option_value: optionValue,
        }));
        const { error: optionsError } = await supabase
          .from('placeholder_variable_options')
          .insert(optionsToInsert);

        if (optionsError) {
          console.error('Error creating placeholder variable options:', optionsError);
          // Decide if this is a fatal error
        }
      }
    }
  }

  // revalidatePath('/'); // Removed: Client-side cannot revalidate
  // Refetch the prompt with tags to return it accurately
  // This is a bit inefficient; ideally, the initial insert and tag logic would be in a transaction
  // and return the complete data, or the client would optimistically update.
  const { data: finalPromptData, error: finalPromptError } = await supabase
    .from('prompts')
    .select(`*,
      prompt_tags(tags(id, name)),
      placeholder_variables(*, placeholder_variable_options(id, option_value))
    `)
    .eq('id', promptData.id)
    .single();

  if (finalPromptError || !finalPromptData) {
    console.error('Error refetching prompt after tag creation:', finalPromptError);
    // Return the basic prompt data if refetch fails, tags might not be immediately visible
    return { ...promptData, tags: [], placeholder_variables: [] } as Prompt;
  }

  return {
    ...finalPromptData,
    tags: finalPromptData.prompt_tags.map((pt: PromptTagFromQuery) => pt.tags).filter(Boolean) as Tag[],
    placeholder_variables: finalPromptData.placeholder_variables
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) // Sort by order_index
      .map(pv_raw => {
        const pv = pv_raw as PlaceholderVariableFromSupabase; // Use the specific helper type
        return {
          id: pv.id,
          name: pv.name,
          type: pv.value_type as 'text' | 'option', // Map db 'value_type' to app 'type'
          options: pv.placeholder_variable_options.map(opt => opt.option_value),
          order_index: pv.order_index || 0,
        };
      }) as PlaceholderVariable[],
  } as Prompt;
}

// Update an existing prompt
interface UpdatePromptArgs extends CreatePromptArgs { // Inherits placeholder_variables
  id: string;
}

export async function updatePrompt(args: UpdatePromptArgs): Promise<Prompt> {
  const user = await getUser();

  // 1. Update the prompt details (prompt_text)
  const { data: promptData, error: promptUpdateError } = await supabase
    .from('prompts')
    .update({
      prompt_text: args.prompt_text,
      updated_at: new Date().toISOString(),
    })
    .eq('id', args.id)
    .eq('user_id', user.id) // Ensure user owns the prompt
    .select('id, prompt_text, user_id, created_at, updated_at')
    .single();

  if (promptUpdateError || !promptData) {
    console.error('Error updating prompt:', promptUpdateError);
    throw new Error('Could not update prompt details.');
  }

  // 2. Handle Tags
  // First, remove existing tag associations for this prompt
  const { error: deleteTagsError } = await supabase
    .from('prompt_tags')
    .delete()
    .eq('prompt_id', args.id);

  if (deleteTagsError) {
    console.error('Error clearing existing tags for prompt:', deleteTagsError);
    // Decide if this is a fatal error or if we can proceed
    throw new Error('Could not update prompt tags (deletion step).');
  }

  // Then, add new/updated tag associations (similar to createPrompt)
  if (args.tagNames && args.tagNames.length > 0) {
    for (const tagName of args.tagNames) {
      const { data, error } = await supabase
        .from('tags')
        .select('id')
        .eq('name', tagName)
        .single();

      let tagData = data;
      const tagError = error;

      if (tagError && tagError.code !== 'PGRST116') {
        console.error('Error finding tag during update:', tagError);
        continue;
      }

      if (!tagData) {
        const { data: newTag, error: newTagError } = await supabase
          .from('tags')
          .insert({ name: tagName })
          .select('id')
          .single();
        if (newTagError) {
          console.error('Error creating new tag during update:', newTagError);
          continue;
        }
        tagData = newTag;
      }

      if (tagData) {
        const { error: promptTagError } = await supabase
          .from('prompt_tags')
          .insert({ prompt_id: args.id, tag_id: tagData.id });
        if (promptTagError) {
          console.error('Error linking tag to prompt during update:', promptTagError);
        }
      }
    }
  }

  // Handle Placeholder Variables for Update
  // 1. Delete existing placeholder variables and their options for this prompt
  // First, delete options associated with the prompt's placeholder variables
  const { data: existingPvs, error: fetchPvError } = await supabase
    .from('placeholder_variables')
    .select('id')
    .eq('prompt_id', args.id);

  if (fetchPvError) {
    console.error('Error fetching existing placeholder variables for deletion:', fetchPvError);
    throw new Error('Could not update placeholder variables (fetch step).');
  }

  if (existingPvs && existingPvs.length > 0) {
    const existingPvIds = existingPvs.map(pv => pv.id);
    const { error: deleteOptionsError } = await supabase
      .from('placeholder_variable_options')
      .delete()
      .in('placeholder_variable_id', existingPvIds);

    if (deleteOptionsError) {
      console.error('Error deleting existing placeholder variable options:', deleteOptionsError);
      throw new Error('Could not update placeholder variables (options deletion step).');
    }

    // Then, delete the placeholder variables themselves
    const { error: deletePvsError } = await supabase
      .from('placeholder_variables')
      .delete()
      .eq('prompt_id', args.id);

    if (deletePvsError) {
      console.error('Error deleting existing placeholder variables:', deletePvsError);
      throw new Error('Could not update placeholder variables (deletion step).');
    }
  }

  // 2. Add new placeholder variables and their options (similar to createPrompt)
  if (args.placeholder_variables && args.placeholder_variables.length > 0) {
    for (let i = 0; i < args.placeholder_variables.length; i++) {
      const pv = args.placeholder_variables[i];
      const { data: pvData, error: pvError } = await supabase
        .from('placeholder_variables')
        .insert({
          prompt_id: args.id, // Use the existing prompt's ID
          name: pv.name,
          value_type: pv.type, // Map app 'type' to db 'value_type'
          order_index: i, // Save the order index
        })
        .select('id')
        .single();

      if (pvError || !pvData) {
        console.error('Error creating placeholder variable during update:', pvError);
        continue;
      }

      if (pv.type === 'option' && pv.options && pv.options.length > 0) {
        const optionsToInsert = pv.options.map(optionValue => ({
          placeholder_variable_id: pvData.id, // Renamed from variable_id
          option_value: optionValue,
        }));
        const { error: optionsError } = await supabase
          .from('placeholder_variable_options')
          .insert(optionsToInsert);

        if (optionsError) {
          console.error('Error creating placeholder variable options during update:', optionsError);
        }
      }
    }
  }

  // 3. Refetch the updated prompt with all its relations to return the complete data
  const { data: finalPromptData, error: finalPromptError } = await supabase
    .from('prompts')
    .select(`*,
      prompt_tags(tags(id, name)),
      placeholder_variables(*, placeholder_variable_options(id, option_value))
    `)
    .eq('id', args.id)
    .single();

  if (finalPromptError || !finalPromptData) {
    console.error('Error refetching prompt after update:', finalPromptError);
    // Return the basic prompt data if refetch fails, tags might not be immediately visible
    // This is a fallback, ideally the transaction would ensure consistency
    // Also ensure promptData is cast to include placeholder_variables if it might be missing
    const basePrompt = promptData as unknown as (Prompt & { placeholder_variables: PlaceholderVariable[] });
    return { ...basePrompt, tags: [], placeholder_variables: basePrompt.placeholder_variables || [] } as Prompt;
  }

  return {
    ...finalPromptData,
    tags: finalPromptData.prompt_tags.map((pt: PromptTagFromQuery) => pt.tags).filter(Boolean) as Tag[],
    placeholder_variables: finalPromptData.placeholder_variables
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)) // Sort by order_index
      .map(pv_raw => {
        const pv = pv_raw as PlaceholderVariableFromSupabase; // Use the specific helper type
        return {
          id: pv.id,
          name: pv.name,
          type: pv.value_type as 'text' | 'option', // Map db 'value_type' to app 'type'
          options: pv.placeholder_variable_options.map(opt => opt.option_value),
          order_index: pv.order_index || 0,
        };
      }) as PlaceholderVariable[],
  } as Prompt;
}

// --- Tag Management (Basic) using the client client ---
export async function getAllTags(): Promise<Tag[]> {
  // const supabase = createServerSupabaseClient(); // Removed
  const { data, error } = await supabase // Uses client supabase
    .from('tags')
    .select('id, name');

  if (error) {
    console.error("Error fetching tags:", error);
    return [];
  }
  return data || [];
}
