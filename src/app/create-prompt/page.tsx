'use client';

import CreatePromptForm from '@/app/components/CreatePromptForm';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function CreatePromptPage() {
  const { user, loading: authLoading } = useAuth();

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

  if (!user) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <div className="container mx-auto text-center py-10">
          <p className="text-xl mb-4">Please sign in to create a new prompt.</p>
          <Link href="/" className="text-sm">
            Go to Sign In
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="container mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold">Create New Prompt</h1>
          <Link href="/" className="bg-sky-600 hover:bg-sky-700 font-bold py-2 px-4 rounded-lg text-md shadow-md transition duration-150 ease-in-out">
            View My Prompts
          </Link>
        </header>
        <CreatePromptForm />
      </div>
    </main>
  );
}
