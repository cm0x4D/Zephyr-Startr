import type { ProjectConfig } from '../types';

export function encodeProjectState(config: ProjectConfig): string {
  const params = new URLSearchParams();
  params.set('name', config.name);
  params.set('version', config.zephyrVersion);
  params.set('board', config.boardId);
  params.set('template', config.templateId);
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
    const modulesStr = params.get('modules');
    const kconfigStr = params.get('kconfig');

    if (!name && !version && !board && !modulesStr) {
      return null;
    }

    const state: Partial<ProjectConfig> = {};
    if (name) state.name = name;
    if (version) state.zephyrVersion = version;
    if (board) state.boardId = board;
    if (template) state.templateId = template;
    if (modulesStr) state.selectedModuleIds = modulesStr.split(',').filter(Boolean);
    if (kconfigStr) {
      state.customKconfig = decodeURIComponent(kconfigStr).split(';').filter(Boolean);
    }

    return state;
  } catch {
    return null;
  }
}
