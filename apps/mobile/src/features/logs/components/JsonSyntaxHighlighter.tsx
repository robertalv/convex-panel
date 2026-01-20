/**
 * JsonSyntaxHighlighter - Syntax highlighting for JSON
 * Simple implementation using React Native Text components
 */

import React from "react";
import { Text, Platform } from "react-native";

export interface JsonSyntaxHighlighterProps {
  json: string;
  theme: any;
}

export function JsonSyntaxHighlighter({
  json,
  theme,
}: JsonSyntaxHighlighterProps) {
  const tokens = tokenizeJson(json);

  return (
    <Text
      style={{
        fontFamily: Platform.select({
          ios: "Menlo",
          android: "monospace",
          default: "monospace",
        }),
        fontSize: 11,
        lineHeight: 16,
      }}
    >
      {tokens.map((token, index) => (
        <Text key={index} style={{ color: getColorForToken(token, theme) }}>
          {token.value}
        </Text>
      ))}
    </Text>
  );
}

// Token types
type TokenType =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "key"
  | "punctuation"
  | "whitespace";

interface Token {
  type: TokenType;
  value: string;
}

/**
 * Tokenize JSON string into syntax tokens
 */
function tokenizeJson(json: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < json.length) {
    const char = json[i];

    // Whitespace
    if (/\s/.test(char)) {
      let whitespace = "";
      while (i < json.length && /\s/.test(json[i])) {
        whitespace += json[i];
        i++;
      }
      tokens.push({ type: "whitespace", value: whitespace });
      continue;
    }

    // Punctuation: {}[]:,
    if (/[{}[\]:,]/.test(char)) {
      tokens.push({ type: "punctuation", value: char });
      i++;
      continue;
    }

    // String (including keys)
    if (char === '"') {
      let str = '"';
      i++;
      let isEscaped = false;

      while (i < json.length) {
        const c = json[i];
        str += c;

        if (c === '"' && !isEscaped) {
          i++;
          break;
        }

        isEscaped = c === "\\" && !isEscaped;
        i++;
      }

      // Check if this string is a key (followed by colon)
      let j = i;
      while (j < json.length && /\s/.test(json[j])) {
        j++;
      }
      const isKey = json[j] === ":";

      tokens.push({ type: isKey ? "key" : "string", value: str });
      continue;
    }

    // Numbers
    if (/[-0-9]/.test(char)) {
      let num = "";
      while (i < json.length && /[-0-9.eE+]/.test(json[i])) {
        num += json[i];
        i++;
      }
      tokens.push({ type: "number", value: num });
      continue;
    }

    // Boolean: true/false
    if (json.substr(i, 4) === "true") {
      tokens.push({ type: "boolean", value: "true" });
      i += 4;
      continue;
    }
    if (json.substr(i, 5) === "false") {
      tokens.push({ type: "boolean", value: "false" });
      i += 5;
      continue;
    }

    // Null
    if (json.substr(i, 4) === "null") {
      tokens.push({ type: "null", value: "null" });
      i += 4;
      continue;
    }

    // Unknown character (shouldn't happen with valid JSON)
    tokens.push({ type: "whitespace", value: char });
    i++;
  }

  return tokens;
}

/**
 * Get color for token based on type
 */
function getColorForToken(token: Token, theme: any): string {
  const isDark = theme.colors.background === "#1A1A1A";

  switch (token.type) {
    case "key":
      return isDark ? "#9CDCFE" : "#0451A5"; // Blue
    case "string":
      return isDark ? "#CE9178" : "#A31515"; // Orange/Red
    case "number":
      return isDark ? "#B5CEA8" : "#098658"; // Green
    case "boolean":
      return isDark ? "#569CD6" : "#0000FF"; // Blue
    case "null":
      return isDark ? "#569CD6" : "#0000FF"; // Blue
    case "punctuation":
      return theme.colors.text;
    case "whitespace":
      return theme.colors.text;
    default:
      return theme.colors.text;
  }
}
