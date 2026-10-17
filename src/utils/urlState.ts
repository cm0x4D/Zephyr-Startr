import type { Language, ProjectConfig } from '../types';

export function encodeProjectState(config: ProjectConfig): string {
  const params = new URLSearchParams();
  params.set('name', config.name);
  params.set('version', config.zephyrVersion);
  params.set('board', config.boardId);
  if (config.language) {
    params.set('lang', config.language);
  }
  if (config.workspaceType) {
    params.set('workspace', config.workspaceType);
  }
  if (config.selectedModuleIds.length > 0) {
    params.set('modules', config.selectedModuleIds.join(','));
  }
  if (config.customKconfig.length > 0) {
    params.set('kconfig', encodeURIComponent(config.customKconfig.join(';')));
  }
  return `${window.location.pathname}?${params.toString()}`;
}

export function decodeProjectState(): Partial<ProjectConfig> | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('name');
    const version = params.get('version');
    const board = params.get('board');
    const template = params.get('template');
    const lang = params.get('lang') as Language;
    const workspace = params.get('workspace');
    const modulesStr = params.get('modules');
    const kconfigStr = params.get('kconfig');

    if (!name && !version && !board && !modulesStr && !workspace && !lang) {
      return null;
    }

    const state: Partial<ProjectConfig> = {};
    if (name) state.name = name;
    if (version) state.zephyrVersion = version;
    if (board) state.boardId = board;
    if (template) state.templateId = template;
    if (workspace === 'standalone' || workspace === 'application') {
      state.workspaceType = workspace;
    }
    if (lang === 'c' || lang === 'cpp' || lang === 'rust') {
      state.language = lang;
    }
    if (modulesStr) {
      state.selectedModuleIds = modulesStr.split(',').filter(Boolean);
      if (!state.language) {
        if (state.selectedModuleIds.includes('lang-cpp')) state.language = 'cpp';
        else if (state.selectedModuleIds.includes('lang-rust')) state.language = 'rust';
        else if (state.selectedModuleIds.includes('lang-c')) state.language = 'c';
      }
    }
    if (kconfigStr) {
      state.customKconfig = decodeURIComponent(kconfigStr).split(';').filter(Boolean);
    }

    return state;
  } catch {
    return null;
  }
}
