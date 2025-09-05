"use client";

import { Prompt } from "@/types"; // Removed PlaceholderVariable import
import React, { useState, useEffect } from "react"; // Import useState and useEffect
import Link from "next/link"; // Import Link from next/link
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardPasteIcon,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";

interface PromptCardProps {
  prompt: Prompt;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );

  // Initialize variableValues with defaultValues from prompt
  useEffect(() => {
    if (prompt.placeholder_variables) {
      const initialValues: Record<string, string> = {};
      prompt.placeholder_variables.forEach((variable) => {
        initialValues[variable.name] = ""; // Removed defaultValue
      });
      setVariableValues(initialValues);
    }
  }, [prompt.placeholder_variables]);

  const handleVariableChange = (variableName: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [variableName]: value }));
  };

  const getProcessedPromptTextToDisplay = () => {
    let text = prompt.prompt_text;
    if (prompt.placeholder_variables) {
      prompt.placeholder_variables.forEach((variable) => {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");
        const value = variableValues[variable.name];
        // If variable has a value, replace with the value; otherwise, keep the placeholder pattern
        text = text.replace(regex, value || `{{${variable.name}}}`);
      });
    }
    return text;
  };

  const getProcessedPromptText = () => {
    let text = prompt.prompt_text;
    if (prompt.placeholder_variables) {
      prompt.placeholder_variables.forEach((variable) => {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, "g");
        text = text.replace(regex, variableValues[variable.name] || ""); // Removed defaultValue
      });
    }
    return text;
  };

  const handleCopy = () => {
    const textToCopy = getProcessedPromptText();
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        // You could add more sophisticated error handling here
      });
  };

  // Add handleReset function
  const handleReset = () => {
    if (prompt.placeholder_variables) {
      const resetValues: Record<string, string> = {};
      prompt.placeholder_variables.forEach((variable) => {
        resetValues[variable.name] = "";
      });
      setVariableValues(resetValues);
    }
  };

  function handlePaste(variableName: string): void {
    navigator.clipboard.readText().then((text) => {
      setVariableValues((prev) => ({ ...prev, [variableName]: text }));
    });
  }

  return (
    <Card>
      <CardContent>
        <p className="whitespace-pre-wrap mb-4">
          {getProcessedPromptTextToDisplay()}
        </p>
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-2 mb-4">
              {prompt.tags.map((tag) => (
                <Badge key={tag.id}>{tag.name}</Badge>
              ))}
            </div>
            {prompt.note && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNote(!showNote)}
                className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <FileText className="h-4 w-4" />
                {showNote ? "Hide Note" : "Show Note"}
                {showNote ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}
        {/* Note Section */}
        {prompt.note && (
          <div className="mb-4">
            {showNote && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md overflow-auto">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: prompt.note }}
                />
              </div>
            )}
          </div>
        )}
        {/* Placeholder Variables Inputs */}
        {prompt.placeholder_variables &&
          prompt.placeholder_variables.length > 0 && (
            <div className="mb-4 space-y-3">
              {prompt.placeholder_variables.map((variable) => (
                <div
                  key={variable.id || variable.name}
                  className="flex flex-col sm:flex-row sm:items-center sm:gap-3"
                >
                  {variable.type === "text" ? (
                    <div className="flex flex-row gap-2 items-center w-full">
                      <Input
                        type="text"
                        id={`var-${prompt.id}-${variable.name}`}
                        value={variableValues[variable.name] || ""}
                        onChange={(e) =>
                          handleVariableChange(variable.name, e.target.value)
                        }
                        placeholder={variable.name}
                      />
                      <Button
                        size="icon"
                        onClick={() => handlePaste(variable.name)}
                      >
                        <ClipboardPasteIcon />
                      </Button>
                    </div>
                  ) : variable.type === "option" &&
                    variable.options &&
                    variable.options.length > 0 ? (
                    <Select
                      value={variableValues[variable.name] || ""}
                      onValueChange={(value) =>
                        handleVariableChange(variable.name, value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={variable.name} />
                      </SelectTrigger>
                      <SelectContent>
                        {variable.options.map((option) => (
                          <SelectItem key={option} value={option || "-"}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm">
                      (No options defined or invalid type)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
      </CardContent>
      {/* Placeholder for edit/delete buttons and variable management */}
      <CardFooter className="gap-2">
        <Button
          size="sm"
          onClick={handleCopy}
          className={`${
            copied
              ? "bg-green-500 hover:bg-green-600"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </Button>
        {/* Add Reset button */}
        {prompt.placeholder_variables &&
          prompt.placeholder_variables.length > 0 && (
            <Button size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
        <Link href={`/edit-prompt/${prompt.id}`} passHref>
          <Button
            size="sm"
            className="text-sm bg-yellow-500 hover:bg-yellow-600 py-1 px-3 rounded-md transition-colors"
          >
            Edit
          </Button>
        </Link>
        <Button
          size="sm"
          className="text-sm bg-red-500 hover:bg-red-600 py-1 px-3 rounded-md transition-colors"
        >
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
