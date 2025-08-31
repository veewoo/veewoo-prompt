"use client";

import { useState, FormEvent, useEffect } from "react";
import { useCreatePrompt, useUpdatePrompt } from "@/hooks/usePrompts";
import type { Prompt, PlaceholderVariable } from "@/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronUp, ChevronDown, X, Plus, Loader2 } from "lucide-react";

interface CreatePromptFormProps {
  promptToEdit?: Prompt | null;
}

export default function CreatePromptForm({
  promptToEdit,
}: CreatePromptFormProps) {
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [tagNames, setTagNames] = useState(""); // Comma-separated tag names
  const [placeholderVariables, setPlaceholderVariables] = useState<
    PlaceholderVariable[]
  >([]); // New state for placeholder variables
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter(); // Initialize useRouter

  const createPromptMutation = useCreatePrompt();
  const updatePromptMutation = useUpdatePrompt();

  const isEditMode = !!promptToEdit;
  const isLoading =
    createPromptMutation.isPending || updatePromptMutation.isPending;
  const error = createPromptMutation.error || updatePromptMutation.error;

  useEffect(() => {
    if (isEditMode && promptToEdit) {
      setTitle(promptToEdit.title);
      setPromptText(promptToEdit.prompt_text);
      // Assuming tags are stored as an array of objects with a 'name' property
      setTagNames(promptToEdit.tags?.map((tag) => tag.name).join(", ") || "");
      setPlaceholderVariables(promptToEdit.placeholder_variables || []); // Set placeholder variables in edit mode
    } else {
      // Reset form if not in edit mode or promptToEdit is cleared
      setTitle("");
      setPromptText("");
      setTagNames("");
      setPlaceholderVariables([]); // Reset placeholder variables
    }
  }, [isEditMode, promptToEdit]);

  // Clear success message when mutations succeed
  useEffect(() => {
    if (createPromptMutation.isSuccess || updatePromptMutation.isSuccess) {
      setSuccessMessage(
        `Prompt ${
          isEditMode ? "updated" : "created"
        } successfully! Redirecting...`
      );
      setTimeout(() => router.push("/"), 2000);
    }
  }, [
    createPromptMutation.isSuccess,
    updatePromptMutation.isSuccess,
    isEditMode,
    router,
  ]);

  // Functions to manage placeholder variables
  const addPlaceholderVariable = () => {
    setPlaceholderVariables([
      ...placeholderVariables,
      { name: "", type: "text", options: [] },
    ]); // Removed defaultValue
  };

  const updatePlaceholderVariable = (
    index: number,
    field: keyof PlaceholderVariable,
    value: string | string[]
  ) => {
    // Changed value type from any
    const newVariables = [...placeholderVariables];
    if (field === "options" && typeof value === "string") {
      newVariables[index] = {
        ...newVariables[index],
        [field]: value.split(",").map((opt) => opt.trim()),
      };
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

  const movePlaceholderVariable = (index: number, direction: "up" | "down") => {
    const newVariables = [...placeholderVariables];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newVariables.length) {
      [newVariables[index], newVariables[targetIndex]] = [
        newVariables[targetIndex],
        newVariables[index],
      ];
      setPlaceholderVariables(newVariables);
    }
  };

  const addOptionToVariable = (variableIndex: number) => {
    const newVariables = [...placeholderVariables];
    const variable = newVariables[variableIndex];
    if (variable.type === "option") {
      variable.options = [...(variable.options || []), ""];
      setPlaceholderVariables(newVariables);
    }
  };

  const updateOptionForVariable = (
    variableIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newVariables = [...placeholderVariables];
    const variable = newVariables[variableIndex];
    if (variable.type === "option" && variable.options) {
      variable.options[optionIndex] = value;
      setPlaceholderVariables(newVariables);
    }
  };

  const removeOptionFromVariable = (
    variableIndex: number,
    optionIndex: number
  ) => {
    const newVariables = [...placeholderVariables];
    const variable = newVariables[variableIndex];
    if (variable.type === "option" && variable.options) {
      variable.options.splice(optionIndex, 1);
      setPlaceholderVariables(newVariables);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!title.trim() || !promptText.trim()) {
      return; // Form validation will handle this
    }

    try {
      const tagsArray = tagNames
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");
      // Include placeholderVariables in the data sent to the server action
      const promptData = {
        title,
        prompt_text: promptText,
        tagNames: tagsArray,
        placeholder_variables: placeholderVariables,
      };

      if (isEditMode && promptToEdit) {
        await updatePromptMutation.mutateAsync({
          id: promptToEdit.id,
          ...promptData,
        });
      } else {
        await createPromptMutation.mutateAsync(promptData);
        // Reset form after successful creation
        setTitle("");
        setPromptText("");
        setTagNames("");
        setPlaceholderVariables([]);
      }
    } catch (err) {
      // Error is handled by React Query and displayed via the error state
      console.error(
        isEditMode ? "Failed to update prompt:" : "Failed to create prompt:",
        err
      );
    }
  };

  return (
    <Card className="mb-12">
      <CardHeader>
        <CardTitle className="text-3xl font-semibold">
          {isEditMode ? "Edit Prompt" : "Create New Prompt"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-100 p-3 rounded-md">
              Error:{" "}
              {error instanceof Error
                ? error.message
                : "An unknown error occurred"}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-900/50 border border-green-700 text-green-100 p-3 rounded-md">
              {successMessage}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter prompt title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promptText">Prompt Text</Label>
            <Textarea
              id="promptText"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={6}
              placeholder="Enter your prompt content here. Use {{placeholder_name}} for variables."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tagNames">Tags (comma-separated)</Label>
            <Input
              type="text"
              id="tagNames"
              value={tagNames}
              onChange={(e) => setTagNames(e.target.value)}
              placeholder="e.g., marketing, blog, social media"
            />
          </div>

          {/* Placeholder Variables Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Placeholder Variables</h3>
            {placeholderVariables.map((variable, index) => (
              <Card key={index}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg">Variable #{index + 1}</h4>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => movePlaceholderVariable(index, "up")}
                        disabled={index === 0}
                        className="h-8 w-8 text-gray-300"
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => movePlaceholderVariable(index, "down")}
                        disabled={index === placeholderVariables.length - 1}
                        className="h-8 w-8 text-gray-300"
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePlaceholderVariable(index)}
                        className="h-8 w-8 text-gray-300"
                        title="Remove"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`var-name-${index}`}>Name</Label>
                    <Input
                      type="text"
                      id={`var-name-${index}`}
                      value={variable.name}
                      onChange={(e) =>
                        updatePlaceholderVariable(index, "name", e.target.value)
                      }
                      placeholder="e.g., tone, product_name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`var-type-${index}`}>Type</Label>
                    <Select
                      value={variable.type}
                      onValueChange={(value) =>
                        updatePlaceholderVariable(
                          index,
                          "type",
                          value as "text" | "option"
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="option">Option</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {variable.type === "option" && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      {variable.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <Input
                            type="text"
                            value={option}
                            onChange={(e) =>
                              updateOptionForVariable(
                                index,
                                optIndex,
                                e.target.value
                              )
                            }
                            className="flex-grow"
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeOptionFromVariable(index, optIndex)
                            }
                            className="h-8 w-8 text-gray-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => addOptionToVariable(index)}
                        className="text-sky-400"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Button type="button" onClick={addPlaceholderVariable}>
              <Plus className="h-4 w-4 mr-2" />
              Add Placeholder Variable
            </Button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full font-bold py-6 text-lg"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Creating..."}
              </>
            ) : isEditMode ? (
              "Update Prompt"
            ) : (
              "Create Prompt"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
