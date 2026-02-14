import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/usePrompts';

// Delete snippet function that calls the API endpoint
async function deleteSnippet(snippetId: string): Promise<void> {
  const response = await fetch(`/api/snippet/${snippetId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to delete snippet' }));
    throw new Error(errorData.error || 'Could not delete snippet.');
  }

  return await response.json();
}

// Hook to delete a snippet (prompt)
export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSnippet,
    onSuccess: (_, snippetId) => {
      // Remove the specific snippet from cache
      queryClient.removeQueries({ queryKey: queryKeys.prompt(snippetId) });
      
      // Invalidate and refetch the prompts list to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts });

      // Optionally invalidate tags if deletion might affect tag usage
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    },
    onError: (error) => {
      console.error('Failed to delete snippet:', error);
    },
  });
}
