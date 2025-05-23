'use client';

import { useState, FormEvent, useEffect } from 'react';
import { createPrompt, updatePrompt } from '@/app/actions/promptActions';
import type { Prompt, PlaceholderVariable } from '@/types';
import { useRouter } from 'next/navigation'; // Import useRouter

interface CreatePromptFormProps {
  promptToEdit?: Prompt | null;
}

export default function CreatePromptForm({ promptToEdit }: CreatePromptFormProps) {
  const [title, setTitle] = useState('');
  const [promptText, setPromptText] = useState('');
  const [tagNames, setTagNames] = useState(''); // Comma-separated tag names
  const [placeholderVariables, setPlaceholderVariables] = useState<PlaceholderVariable[]>([]); // New state for placeholder variables
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter

  const isEditMode = !!promptToEdit;

  useEffect(() => {
    if (isEditMode && promptToEdit) {
      setTitle(promptToEdit.title);
      setPromptText(promptToEdit.prompt_text);
      // Assuming tags are stored as an array of objects with a 'name' property
      setTagNames(promptToEdit.tags?.map(tag => tag.name).join(', ') || '');
      setPlaceholderVariables(promptToEdit.placeholder_variables || []); // Set placeholder variables in edit mode
    } else {
      // Reset form if not in edit mode or promptToEdit is cleared
      setTitle('');
      setPromptText('');
      setTagNames('');
      setPlaceholderVariables([]); // Reset placeholder variables
    }
  }, [isEditMode, promptToEdit]);

  // Functions to manage placeholder variables
  const addPlaceholderVariable = () => {
    setPlaceholderVariables([...placeholderVariables, { name: '', type: 'text', options: [] }]); // Removed defaultValue
  };

  const updatePlaceholderVariable = (index: number, field: keyof PlaceholderVariable, value: string | string[]) => { // Changed value type from any
    const newVariables = [...placeholderVariables];
    if (field === 'options' && typeof value === 'string') {
      newVariables[index] = { ...newVariables[index], [field]: value.split(',').map(opt => opt.trim()) };
    } else {
      newVariables[index] = { ...newVariables[index], [field]: value };
    }
    setPlaceholderVariables(newVariables);
  };

  const removePlaceholderVariable = (index: number) => {
    const newVariables = [...placeholderVariables];
    newVariables.splice(index, 1);
    setPlaceholderVariables(newVariables);
  };

  const addOptionToVariable = (variableIndex: number) => {
    const newVariables = [...placeholderVariables];
    const variable = newVariables[variableIndex];
    if (variable.type === 'option') {
      variable.options = [...(variable.options || []), ''];
      setPlaceholderVariables(newVariables);
    }
  };

  const updateOptionForVariable = (variableIndex: number, optionIndex: number, value: string) => {
    const newVariables = [...placeholderVariables];
    const variable = newVariables[variableIndex];
    if (variable.type === 'option' && variable.options) {
      variable.options[optionIndex] = value;
      setPlaceholderVariables(newVariables);
    }
  };

  const removeOptionFromVariable = (variableIndex: number, optionIndex: number) => {
    const newVariables = [...placeholderVariables];
    const variable = newVariables[variableIndex];
    if (variable.type === 'option' && variable.options) {
      variable.options.splice(optionIndex, 1);
      setPlaceholderVariables(newVariables);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!title.trim() || !promptText.trim()) {
      setError('Title and prompt text cannot be empty.');
      setIsLoading(false);
      return;
    }

    try {
      const tagsArray = tagNames.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      // Include placeholderVariables in the data sent to the server action
      const promptData = { title, prompt_text: promptText, tagNames: tagsArray, placeholder_variables: placeholderVariables };

      if (isEditMode && promptToEdit) {
        await updatePrompt({ id: promptToEdit.id, ...promptData });
        setSuccessMessage('Prompt updated successfully! Redirecting...');
        setTimeout(() => router.push('/'), 2000);
      } else {
        await createPrompt(promptData);
        setTitle('');
        setPromptText('');
        setTagNames('');
        setPlaceholderVariables([]); // Reset placeholder variables after creation
        setSuccessMessage('Prompt created successfully! Redirecting...');
        setTimeout(() => router.push('/'), 2000);
      }
      // The page will be revalidated by the server action, refreshing the prompt list
    } catch (err) {
      console.error(isEditMode ? 'Failed to update prompt:' : 'Failed to create prompt:', err);
      if (err instanceof Error) {
        setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} prompt. Please try again.`);
      } else {
        setError(`An unknown error occurred while ${isEditMode ? 'updating' : 'creating'} the prompt.`);
      }
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-12 p-6 bg-gray-800 rounded-lg shadow-xl space-y-6">
      <h2 className="text-3xl font-semibold text-sky-400 mb-6">{isEditMode ? 'Edit Prompt' : 'Create New Prompt'}</h2>
      {error && <p className="text-red-400 bg-red-900 p-3 rounded-md">Error: {error}</p>}
      {successMessage && <p className="text-green-400 bg-green-900 p-3 rounded-md">{successMessage}</p>}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          placeholder="Enter prompt title"
          required
        />
      </div>
      <div>
        <label htmlFor="promptText" className="block text-sm font-medium text-gray-300 mb-1">Prompt Text</label>
        <textarea
          id="promptText"
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          rows={6}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          placeholder="Enter your prompt content here. Use {{placeholder_name}} for variables."
          required
        />
      </div>
      <div>
        <label htmlFor="tagNames" className="block text-sm font-medium text-gray-300 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          id="tagNames"
          value={tagNames}
          onChange={(e) => setTagNames(e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          placeholder="e.g., marketing, blog, social media"
        />
      </div>

      {/* Placeholder Variables Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-sky-500">Placeholder Variables</h3>
        {placeholderVariables.map((variable, index) => (
          <div key={index} className="p-4 border border-gray-700 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-lg text-gray-300">Variable #{index + 1}</h4>
              <button
                type="button"
                onClick={() => removePlaceholderVariable(index)}
                className="text-red-500 hover:text-red-400 text-sm"
              >
                Remove
              </button>
            </div>
            <div>
              <label htmlFor={`var-name-${index}`} className="block text-sm font-medium text-gray-400 mb-1">Name</label>
              <input
                type="text"
                id={`var-name-${index}`}
                value={variable.name}
                onChange={(e) => updatePlaceholderVariable(index, 'name', e.target.value)}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-sky-500"
                placeholder="e.g., tone, product_name"
                required
              />
            </div>
            <div>
              <label htmlFor={`var-type-${index}`} className="block text-sm font-medium text-gray-400 mb-1">Type</label>
              <select
                id={`var-type-${index}`}
                value={variable.type}
                onChange={(e) => updatePlaceholderVariable(index, 'type', e.target.value as 'text' | 'option')}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-sky-500"
              >
                <option value="text">Text</option>
                <option value="option">Option</option>
              </select>
            </div>
            {variable.type === 'option' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Options (comma-separated)</label>
                {variable.options?.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOptionForVariable(index, optIndex, e.target.value)}
                      className="flex-grow p-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:ring-1 focus:ring-sky-500"
                      placeholder={`Option ${optIndex + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeOptionFromVariable(index, optIndex)}
                      className="text-red-500 hover:text-red-400 text-xs p-1"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOptionToVariable(index)}
                  className="text-sky-500 hover:text-sky-400 text-sm"
                >
                  + Add Option
                </button>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addPlaceholderVariable}
          className="mt-2 bg-sky-700 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
        >
          + Add Placeholder Variable
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {isEditMode ? 'Updating...' : 'Creating...'}
          </span>
        ) : isEditMode ? 'Update Prompt' : 'Create Prompt'}
      </button>
    </form>
  );
}
