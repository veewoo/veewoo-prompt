"use client";

import { Prompt } from "@/types"; // Removed PlaceholderVariable import
import React, { useState, useEffect } from "react"; // Import useState and useEffect
import Link from "next/link"; // Import Link from next/link

interface PromptCardProps {
  prompt: Prompt;
}

export default function PromptCard({ prompt }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
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

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 ease-in-out">
      <p className="text-gray-300 whitespace-pre-wrap mb-4">
        {getProcessedPromptTextToDisplay()}
      </p>

      {/* Placeholder Variables Inputs */}
      {prompt.placeholder_variables &&
        prompt.placeholder_variables.length > 0 && (
          <div className="mb-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-400 mb-1">
              Variables:
            </h4>
            {prompt.placeholder_variables.map((variable) => (
              <div
                key={variable.id || variable.name}
                className="flex flex-col sm:flex-row sm:items-center sm:gap-3"
              >
                <label
                  htmlFor={`var-${prompt.id}-${variable.name}`}
                  className="text-sm text-gray-300 mb-1 sm:mb-0 sm:w-1/3"
                >
                  {variable.name}:
                </label>
                {variable.type === "text" ? (
                  <input
                    type="text"
                    id={`var-${prompt.id}-${variable.name}`}
                    value={variableValues[variable.name] || ""}
                    onChange={(e) =>
                      handleVariableChange(variable.name, e.target.value)
                    }
                    className="w-full sm:w-2/3 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-sky-500"
                    placeholder={"Enter value"} // Removed defaultValue
                  />
                ) : variable.type === "option" &&
                  variable.options &&
                  variable.options.length > 0 ? (
                  <select
                    id={`var-${prompt.id}-${variable.name}`}
                    value={variableValues[variable.name] || ""}
                    onChange={(e) =>
                      handleVariableChange(variable.name, e.target.value)
                    }
                    className="w-full sm:w-2/3 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="">Select an option</option>
                    {variable.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-gray-500">
                    {" "}
                    (No options defined or invalid type)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

      {prompt.tags && prompt.tags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-400 mb-1">Tags:</h4>
          <div className="flex flex-wrap gap-2">
            {prompt.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1 bg-sky-600 text-white text-xs rounded-full font-medium"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Placeholder for edit/delete buttons and variable management */}
      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={handleCopy}
          className={`text-sm py-1 px-3 rounded-md transition-colors ${
            copied
              ? "bg-green-500 hover:bg-green-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        {/* Add Reset button */}
        {prompt.placeholder_variables && prompt.placeholder_variables.length > 0 && (
          <button
            onClick={handleReset}
            className="text-sm bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded-md transition-colors"
          >
            Reset
          </button>
        )}
        <Link href={`/edit-prompt/${prompt.id}`} passHref>
          <button className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md transition-colors">
            Edit
          </button>
        </Link>
        <button className="text-sm bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md transition-colors">
          Delete
        </button>
      </div>
    </div>
  );
}
