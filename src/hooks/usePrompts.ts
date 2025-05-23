import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getPrompts, 
  getPromptById, 
  createPrompt, 
  updatePrompt, 
  getAllTags 
} from '@/app/actions/promptActions';

// Query keys
export const queryKeys = {
  prompts: ['prompts'] as const,
  prompt: (id: string) => ['prompts', id] as const,
  tags: ['tags'] as const,
};

// Fetch all prompts for the current user
export function usePrompts() {
  return useQuery({
    queryKey: queryKeys.prompts,
    queryFn: getPrompts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch a single prompt by ID
export function usePrompt(promptId: string) {
  return useQuery({
    queryKey: queryKeys.prompt(promptId),
    queryFn: () => getPromptById(promptId),
    enabled: !!promptId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch all tags
export function useTags() {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: getAllTags,
    staleTime: 10 * 60 * 1000, // 10 minutes - tags change less frequently
  });
}

// Create a new prompt
export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPrompt,
    onSuccess: (newPrompt) => {
      // Invalidate and refetch prompts
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts });
      
      // Optionally add the new prompt to the cache
      queryClient.setQueryData(queryKeys.prompt(newPrompt.id), newPrompt);

      // Invalidate tags in case new tags were created
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    },
    onError: (error) => {
      console.error('Failed to create prompt:', error);
    },
  });
}

// Update an existing prompt
export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePrompt,
    onSuccess: (updatedPrompt) => {
      // Update the specific prompt in cache
      queryClient.setQueryData(queryKeys.prompt(updatedPrompt.id), updatedPrompt);
      
      // Invalidate and refetch prompts to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.prompts });

      // Invalidate tags in case tags were modified
      queryClient.invalidateQueries({ queryKey: queryKeys.tags });
    },
    onError: (error) => {
      console.error('Failed to update prompt:', error);
    },
  });
}

// Combined hook for loading initial data (prompts + tags)
export function useInitialData() {
  const promptsQuery = usePrompts();
  const tagsQuery = useTags();

  return {
    prompts: promptsQuery.data || [],
    tags: tagsQuery.data || [],
    isLoading: promptsQuery.isLoading || tagsQuery.isLoading,
    error: promptsQuery.error || tagsQuery.error,
    refetch: () => {
      promptsQuery.refetch();
      tagsQuery.refetch();
    },
  };
}
