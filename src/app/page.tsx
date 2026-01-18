"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useInitialData } from "@/hooks/usePrompts";
import PromptCard from "@/app/_components/PromptCard";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PromptsPage() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const { prompts, tags, isLoading: loadingData, error } = useInitialData();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const filteredPrompts = prompts.filter((prompt) => {
    if (selectedTags.length === 0) return true;
    return prompt.tags?.some((tag) => selectedTags.includes(tag.id)) ?? false;
  });

  if (authLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          <p className="ml-3 text-lg">Loading authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <header className="flex flex-wrap justify-between items-center mb-10">
          <div className="flex items-center gap-4 w-full">
            {!user && (
              <Button onClick={signInWithGoogle}>Sign in with Google</Button>
            )}
            {user && (
              <>
                <div>Welcome, {user.email}!</div>
                <div className="flex items-center gap-4 ml-auto" >
                  <Button asChild>
                    <Link href="/create-prompt">Create New Prompt</Link>
                  </Button>
                  <Button variant="destructive" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </>
            )}
          </div>
        </header>

        {!user && (
          <div className="text-center py-10">
            <p className="text-xl">Please sign in to view your prompts.</p>
          </div>
        )}

        {user && (
          <>
            {error && (
              <p className="bg-red-900 p-3 rounded-md my-4">{error.message}</p>
            )}

            <section className="mb-12 flex gap-4">
              {tags.length === 0 && !loadingData && (
                <p className="">No tags available.</p>
              )}
              <div className="flex flex-wrap gap-2 mb-6">
                {tags.map((tag) => (
                  <Button
                    size="sm"
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`hover:bg-sky-600
                      ${selectedTags.includes(tag.id)
                        ? "bg-sky-600"
                        : "bg-gray-700 hover:bg-gray-600"
                      }`}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </section>

            <section>
              {loadingData && (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500"></div>
                  <p className="ml-3 text-lg">Loading prompts...</p>
                </div>
              )}
              {!loadingData && filteredPrompts.length === 0 && (
                <p className="text-center py-10">
                  {selectedTags.length > 0
                    ? "No prompts match the selected tags."
                    : 'You haven\'t created any prompts yet. Click "Create New Prompt" to get started!'}
                </p>
              )}
              {!loadingData && filteredPrompts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPrompts.map((prompt) => (
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
