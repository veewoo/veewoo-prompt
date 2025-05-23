'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useInitialData } from '@/hooks/usePrompts';
import PromptCard from '@/app/components/PromptCard';
import Link from 'next/link';

export default function PromptsPage() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const { prompts, tags, isLoading: loadingData, error } = useInitialData();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const filteredPrompts = prompts.filter(prompt => {
    if (selectedTags.length === 0) return true;
    return prompt.tags?.some(tag => selectedTags.includes(tag.id)) ?? false;
  });

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          <p className="ml-3 text-lg">Loading authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-sky-400">Your Prompts</h1>
          <div className="flex items-center gap-4">
            {!user && (
              <button
                onClick={signInWithGoogle}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-md shadow-md transition duration-150 ease-in-out"
              >
                Sign in with Google
              </button>
            )}
            {user && (
              <>
                <span className="text-gray-300">Welcome, {user.email}!</span>
                <Link href="/create-prompt" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-md shadow-md transition duration-150 ease-in-out">
                  Create New Prompt
                </Link>
                <button
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-md shadow-md transition duration-150 ease-in-out"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </header>

        {!user && (
          <div className="text-center py-10">
            <p className="text-xl text-gray-400">Please sign in to view your prompts.</p>
          </div>
        )}

        {user && (
          <>
            {error && (
              <p className="text-red-400 bg-red-900 p-3 rounded-md my-4">
                Error: {error instanceof Error ? error.message : 'An unknown error occurred'}
              </p>
            )}

            <section className="mb-12">
              <h2 className="text-2xl font-semibold text-sky-500 mb-4">Filter by Tags</h2>
              {tags.length === 0 && !loadingData && <p className="text-gray-500">No tags available.</p>}
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedTags.includes(tag.id)
                        ? 'bg-sky-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </section>

            <section>
              {loadingData && (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
                  <p className="ml-3 text-lg text-gray-400">Loading prompts...</p>
                </div>
              )}
              {!loadingData && filteredPrompts.length === 0 && (
                <p className="text-gray-500 text-center py-10">
                  {selectedTags.length > 0 ? 'No prompts match the selected tags.' : 'You haven\'t created any prompts yet. Click \"Create New Prompt\" to get started!'}
                </p>
              )}
              {!loadingData && filteredPrompts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPrompts.map(prompt => (
                    <PromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
