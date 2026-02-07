
export enum View {
  DASHBOARD = 'dashboard',
  LIBRARY = 'library',
  FILES = 'files',
  ANALYSIS = 'analysis',
  MEMORY = 'memory',
  CITATIONS = 'citations',
  SETTINGS = 'settings',
  EDITOR = 'editor'
}

export interface FileData {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'csv' | 'txt';
  size: string;
  uploadedAt: string;
  status: 'Ready' | 'Processing...' | 'Ready for Analysis';
}

export interface Paper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  citations: string;
  claims: string[];
  recommended?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  verifiedSource?: {
    title: string;
    source: string;
    doi: string;
  };
}
