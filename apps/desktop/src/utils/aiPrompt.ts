import type { ErrorAnalysis } from './api/aiAnalysis';
import { copyToClipboard } from './toast';

/**
 * Options for generating an AI prompt from error analysis
 */
export interface GenerateAIPromptOptions {
  analysis: ErrorAnalysis;
  functionPath?: string;
  errorMessage?: string;
  errorId?: string;
}

/**
 * Generate an AI prompt string from error analysis data
 * @param options - The error analysis and related data
 * @returns The formatted AI prompt string
 */
export const generateAIPrompt = (options: GenerateAIPromptOptions): string => {
  const { analysis, functionPath, errorMessage, errorId } = options;
  const parts: string[] = [];
  
  parts.push('I encountered an error in my Convex function. Please help me fix it.\n');
  
  // Use provided functionPath or fall back to analysis.functionPath
  const finalFunctionPath = functionPath || analysis.functionPath;
  if (finalFunctionPath) {
    parts.push(`**Function:** \`${finalFunctionPath}\``);
  }
  
  // Use provided errorMessage or fall back to analysis.errorMessage
  const finalErrorMessage = errorMessage || analysis.errorMessage;
  if (finalErrorMessage) {
    parts.push(`\n**Error Message:**\n\`\`\`\n${finalErrorMessage}\n\`\`\``);
  }
  
  // Use provided errorId or fall back to analysis.errorId
  const finalErrorId = errorId || analysis.errorId;
  if (finalErrorId) {
    parts.push(`\n**Error ID:** ${finalErrorId}`);
  }
  
  parts.push(`\n**AI Analysis (${Math.round(analysis.confidence * 100)}% confidence, ${analysis.severity} severity):**`);
  
  if (analysis.rootCause) {
    parts.push(`\n**Root Cause:**\n${analysis.rootCause}`);
  }
  
  if (analysis.suggestions && analysis.suggestions.length > 0) {
    parts.push(`\n**Suggestions:**`);
    analysis.suggestions.forEach((suggestion, i) => {
      parts.push(`${i + 1}. ${suggestion}`);
    });
  }
  
  if (analysis.relatedIssues && analysis.relatedIssues.length > 0) {
    parts.push(`\n**Related Issues:**`);
    analysis.relatedIssues.forEach((issue, i) => {
      parts.push(`${i + 1}. ${issue}`);
    });
  }
  
  parts.push(`\n\nPlease provide a fix for this error.`);
  
  return parts.join('\n');
};

/**
 * Generate an AI prompt and copy it to clipboard
 * @param options - The error analysis and related data
 * @returns Promise that resolves when the prompt has been copied
 */
export const handleCopyAIPrompt = async (options: GenerateAIPromptOptions): Promise<void> => {
  const prompt = generateAIPrompt(options);
  await copyToClipboard(prompt, 'AI prompt copied to clipboard!');
};
