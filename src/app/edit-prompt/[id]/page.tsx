'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CreatePromptForm from '@/app/components/CreatePromptForm';
import { useAuth } from '@/contexts/AuthContext';
import { getPromptById } from '@/app/actions/promptActions';
import type { Prompt } from '@/types';

export default function EditPromptPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const promptId = params.id as string;

  const [promptToEdit, setPromptToEdit] = useState<Prompt | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/'); // Redirect to sign-in or home if not authenticated
      return;
    }

    if (user && promptId) {
      const fetchPrompt = async () => {
        setLoadingPrompt(true);
        setError(null);
        try {
          const promptData = await getPromptById(promptId);
          if (promptData) {
            // user_id is present on promptData from the DB, and Prompt type includes user_id
            if (promptData.user_id !== user.id) {
              setError('You are not authorized to edit this prompt.');
              setPromptToEdit(null);
            } else {
              setPromptToEdit(promptData);
            }
          } else {
            setError('Prompt not found.');
          }
        } catch (err) {
          console.error('Failed to fetch prompt:', err);
          setError(err instanceof Error ? err.message : 'Failed to load prompt.');
        } finally {
          setLoadingPrompt(false);
        }
      };
      fetchPrompt();
    }
  }, [promptId, user, authLoading, router]);

  if (authLoading || loadingPrompt) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
          <p className="ml-3 text-lg">
            {authLoading ? 'Loading authentication...' : 'Loading prompt data...'}
          </p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto text-center py-10">
          <p className="text-xl text-gray-400 mb-4">
            Please sign in to edit this prompt.
          </p>
          <Link href="/" className="text-sky-500 hover:text-sky-400">
            Go to Sign In
          </Link>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto text-center py-10">
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-sky-500 hover:text-sky-400">
            Back to My Prompts
          </Link>
        </div>
      </main>
    );
  }

  if (!promptToEdit) {
    return (
      <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
        <div className="container mx-auto text-center py-10">
          <p className="text-xl text-gray-400 mb-4">Prompt not available or you do not have permission to edit it.</p>
          <Link href="/" className="text-sky-500 hover:text-sky-400">
            Back to My Prompts
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-sky-400">Edit Prompt</h1>
          <Link href="/" className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg text-md shadow-md transition duration-150 ease-in-out">
            View My Prompts
          </Link>
        </header>
        <CreatePromptForm promptToEdit={promptToEdit} />
      </div>
    </main>
  );
}
