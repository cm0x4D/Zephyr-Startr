export interface Board {
  id: string;
  name: string;
  board: string;
  target: string;
  vendor: string;
  vendorKey: string;
  arch: string;
  popular?: boolean;
  description?: string;
  soc?: string;
  ram?: number;
  flash?: number;
}

export interface Module {
  id: string;
  name: string;
  category: string;
  description: string;
  kconfig: string[];
  dependencies?: string[];
  westModules?: string[];
  tags: string[];
  includes?: string[];
  mainInit?: string;
  defaultSelected?: boolean;
}

export interface Release {
  tag: string;
  name: string;
  lts?: boolean;
  isBranch?: boolean;
  isLatest?: boolean;
  publishedAt?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  recommendedModules: string[];
}

export type WorkspaceType = 'standalone' | 'application';
export type Language = 'c' | 'cpp' | 'rust';

export interface ProjectConfig {
  name: string;
  zephyrVersion: string;
  boardId: string;
  templateId: string;
  language: Language;
  selectedModuleIds: string[];
  customKconfig: string[];
  workspaceType: WorkspaceType;
}

export interface GeneratedFile {
  path: string;
  name: string;
  content: string;
  language: 'c' | 'cpp' | 'rust' | 'cmake' | 'yaml' | 'ini' | 'markdown' | 'text' | 'toml';
}
