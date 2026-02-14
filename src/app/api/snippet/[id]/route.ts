import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

// DELETE /api/prompts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: promptId } = await params

    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient()

    // Get authenticated user via getClaims() (per Supabase SSR doc)
    const { data, error: authError } = await supabase.auth.getClaims()
    const userId = data?.claims?.sub

    if (authError || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete placeholder variable options first (due to foreign key constraints)
    const { data: existingPvs, error: fetchPvError } = await supabase
      .from('placeholder_variables')
      .select('id')
      .eq('prompt_id', promptId)

    if (fetchPvError) {
      console.error('Error fetching placeholder variables:', fetchPvError)
      return NextResponse.json(
        { error: 'Failed to delete related data' },
        { status: 500 }
      )
    }

    // Delete placeholder variable options if they exist
    if (existingPvs && existingPvs.length > 0) {
      const existingPvIds = existingPvs.map(pv => pv.id)
      
      const { error: deleteOptionsError } = await supabase
        .from('placeholder_variable_options')
        .delete()
        .in('placeholder_variable_id', existingPvIds)

      if (deleteOptionsError) {
        console.error('Error deleting placeholder variable options:', deleteOptionsError)
        return NextResponse.json(
          { error: 'Failed to delete related options' },
          { status: 500 }
        )
      }

      // Delete placeholder variables
      const { error: deletePvsError } = await supabase
        .from('placeholder_variables')
        .delete()
        .eq('prompt_id', promptId)

      if (deletePvsError) {
        console.error('Error deleting placeholder variables:', deletePvsError)
        return NextResponse.json(
          { error: 'Failed to delete placeholder variables' },
          { status: 500 }
        )
      }
    }

    // Delete prompt_tags associations
    const { error: deleteTagsError } = await supabase
      .from('prompt_tags')
      .delete()
      .eq('prompt_id', promptId)

    if (deleteTagsError) {
      console.error('Error deleting prompt tags:', deleteTagsError)
      return NextResponse.json(
        { error: 'Failed to delete tag associations' },
        { status: 500 }
      )
    }

    // Finally, delete the prompt itself
    const { error: deletePromptError } = await supabase
      .from('prompts')
      .delete()
      .eq('id', promptId)
      .eq('user_id', userId) // Ensure user owns the prompt

    if (deletePromptError) {
      console.error('Error deleting prompt:', deletePromptError)
      return NextResponse.json(
        { error: 'Failed to delete prompt' },
        { status: 500 }
      )
    }

    // Return success response
    return NextResponse.json(
      { message: 'Prompt deleted successfully', id: promptId },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error in DELETE /api/prompts/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}