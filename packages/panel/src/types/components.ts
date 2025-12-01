import React from 'react';

export type ComponentCategory = 'Durable Functions' | 'Database' | 'Integrations' | 'Backend';

export interface ComponentInfo {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  weeklyDownloads: number;
  developer: string;
  category: ComponentCategory;
  npmPackage?: string;
  imageUrl?: string;
  longDescription?: string;
  features?: string[];
  repoUrl?: string;
  packageUrl?: string;
  docsUrl?: string;
  docsLinks?: Array<{ label: string; url: string }>;
  stackPostUrl?: string;
  exampleCommands?: string[];
  bugReportUrl?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  documentationSections?: Array<{
    heading: string;
    subsections?: Array<{
      subheading?: string;
      paragraphs?: string[];
      code?: string;
    }>;
    paragraphs?: string[];
    code?: string;
    codeBlocks?: Array<{
      code?: string;
      note?: string;
    }>;
    language?: string;
  }>;
}
