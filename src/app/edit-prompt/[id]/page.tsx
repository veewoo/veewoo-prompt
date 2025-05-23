'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CreatePromptForm from '@/app/components/CreatePromptForm';
import { useAuth } from '@/contexts/AuthContext';
import { usePrompt } from '@/hooks/usePrompts';

export default function EditPromptPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const promptId = params.id as string;

  const { 
    data: promptToEdit, 
    isLoading: loadingPrompt, 
    error 
  } = usePrompt(promptId);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/'); // Redirect to sign-in or home if not authenticated
      return;
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (promptToEdit && user && promptToEdit.user_id !== user.id) {
      router.push('/'); // Redirect if user doesn't own this prompt
    }
  }, [promptToEdit, user, router]);

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

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-sky-400">Edit Prompt</h1>
          <Link 
            href="/" 
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-md shadow-md transition duration-150 ease-in-out"
          >
            ← Back to Prompts
          </Link>
        </header>

        {loadingPrompt && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
            <p className="ml-3 text-lg text-gray-400">Loading prompt...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-400 text-xl mb-4">
              {error instanceof Error ? error.message : 'Failed to load prompt'}
            </p>
            <Link 
              href="/" 
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-lg shadow-md transition duration-150 ease-in-out"
            >
              Go Back Home
            </Link>
          </div>
        )}

        {!loadingPrompt && !error && promptToEdit && promptToEdit.user_id === user.id && (
          <CreatePromptForm promptToEdit={promptToEdit} />
        )}

        {!loadingPrompt && !error && promptToEdit && promptToEdit.user_id !== user.id && (
          <div className="text-center py-20">
            <p className="text-red-400 text-xl mb-4">You are not authorized to edit this prompt.</p>
            <Link 
              href="/" 
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-lg shadow-md transition duration-150 ease-in-out"
            >
              Go Back Home
            </Link>
          </div>
        )}

        {!loadingPrompt && !error && !promptToEdit && (
          <div className="text-center py-20">
            <p className="text-red-400 text-xl mb-4">Prompt not found.</p>
            <Link 
              href="/" 
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-lg shadow-md transition duration-150 ease-in-out"
            >
              Go Back Home
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
