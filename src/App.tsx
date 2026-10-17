import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Board, GeneratedFile, Module, ProjectConfig, ProjectTemplate, Release } from './types';
import { fetchBoards, fetchModules, fetchReleases } from './services/zephyrApi';
import { downloadProjectZip, generateAllFiles } from './services/generator';
import { decodeProjectState, encodeProjectState } from './utils/urlState';
import { Header } from './components/Header';
import { ProjectSettings } from './components/ProjectSettings';
import { Dependencies } from './components/Dependencies';
import { KconfigEditor } from './components/KconfigEditor';
import { BoardModal } from './components/BoardModal';
import { FileExplorerModal } from './components/FileExplorerModal';
import { ActionBar } from './components/ActionBar';
import { ApiTokenModal } from './components/ApiTokenModal';
import { Toast, type ToastMessage } from './components/Toast';
import { Terminal } from 'lucide-react';
import './App.css';

const DEFAULT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blinky',
    name: 'Blinky / Status LED',
    description: 'Toggles status LED on GPIO pin using Devicetree alias led0',
    recommendedModules: ['gpio', 'logging', 'console'],
  },
  {
    id: 'minimal',
    name: 'Minimal Hello World',
    description: 'Barebones skeleton with printk output and kernel uptime loop',
    recommendedModules: ['console', 'logging'],
  },
  {
    id: 'bluetooth',
    name: 'Bluetooth LE Peripheral',
    description: 'BLE host stack with peripheral advertising and dynamic GATT',
    recommendedModules: ['bluetooth', 'logging', 'console'],
  },
  {
    id: 'shell',
    name: 'Interactive Shell',
    description: 'Command line interface over UART for live inspection and commands',
    recommendedModules: ['shell', 'logging', 'console'],
  },
  {
    id: 'sensor',
    name: 'Sensor Subsystem',
    description: 'Unified sensor API reading channels via I2C/SPI bus',
    recommendedModules: ['sensor', 'i2c', 'logging', 'console'],
  },
  {
    id: 'iot',
    name: 'IoT Network Client',
    description: 'Wi-Fi, BSD sockets, HTTP client, and MQTT telemetry',
    recommendedModules: ['networking', 'wifi', 'mqtt', 'http', 'logging', 'console'],
  },
];

const DEFAULT_CONFIG: ProjectConfig = {
  name: 'my-zephyr-app',
  zephyrVersion: 'v4.4.2',
  boardId: 'nrf52840dk/nrf52840',
  templateId: 'blinky',
  language: 'c',
  selectedModuleIds: ['lang-c', 'logging', 'console', 'gpio'],
  customKconfig: [],
  workspaceType: 'standalone',
};

export const App: React.FC = () => {
  const [config, setConfig] = useState<ProjectConfig>(() => {
    const urlState = decodeProjectState();
    if (!urlState) return DEFAULT_CONFIG;
    const initialConfig = { ...DEFAULT_CONFIG, ...urlState };
    // Ensure language module is in selectedModuleIds
    const langModuleId = initialConfig.language === 'cpp' ? 'lang-cpp' : (initialConfig.language === 'rust' ? 'lang-rust' : 'lang-c');
    const langModules = ['lang-c', 'lang-cpp', 'lang-rust'];
    const filtered = initialConfig.selectedModuleIds.filter((id) => !langModules.includes(id));
    initialConfig.selectedModuleIds = [langModuleId, ...filtered];
    return initialConfig;
  });

  const [boards, setBoards] = useState<Board[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);

  const [apiSource, setApiSource] = useState<'api' | 'cached' | 'bundled'>('bundled');
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Modals state
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initial resources load on mount
  const refreshResources = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [relsRes, boardsRes, mods] = await Promise.all([
        fetchReleases(),
        fetchBoards(),
        fetchModules(),
      ]);

      setReleases(relsRes.releases);
      setApiSource(relsRes.source);
      setRateLimitRemaining(relsRes.rateLimitRemaining);
      setBoards(boardsRes.boards);
      setModules(mods);

      if (relsRes.releases.length > 1 && config.zephyrVersion === DEFAULT_CONFIG.zephyrVersion) {
        const latest = relsRes.releases.find((r) => r.isLatest) || relsRes.releases[1];
        if (latest) {
          setConfig((prev) => ({ ...prev, zephyrVersion: latest.tag }));
        }
      }
    } catch (err) {
      console.error('Failed to load Zephyr resources:', err);
      addToast('Failed to load latest online resources, using offline cache.', 'warning');
    } finally {
      setIsRefreshing(false);
    }
  }, [addToast, config.zephyrVersion]);

  useEffect(() => {
    let ignore = false;
    fetchReleases().then((relsRes) => {
      if (ignore) return;
      setReleases(relsRes.releases);
      setApiSource(relsRes.source);
      setRateLimitRemaining(relsRes.rateLimitRemaining);
      if (relsRes.releases.length > 1) {
        const latest = relsRes.releases.find((r) => r.isLatest) || relsRes.releases[1];
        if (latest) {
          setConfig((prev) =>
            prev.zephyrVersion === DEFAULT_CONFIG.zephyrVersion
              ? { ...prev, zephyrVersion: latest.tag }
              : prev
          );
        }
      }
    });

    fetchBoards().then((boardsRes) => {
      if (!ignore) setBoards(boardsRes.boards);
    });

    fetchModules().then((mods) => {
      if (!ignore) setModules(mods);
    });

    return () => {
      ignore = true;
    };
  }, []);

  // Active board object
  const currentBoard = useMemo(() => {
    return (
      boards.find((b) => b.id === config.boardId) ||
      boards.find((b) => b.board === config.boardId)
    );
  }, [boards, config.boardId]);

  // Selected module objects
  const selectedModules = useMemo(() => {
    const set = new Set(config.selectedModuleIds);
    return modules.filter((m) => set.has(m.id));
  }, [modules, config.selectedModuleIds]);

  // Generated files preview
  const generatedFiles: GeneratedFile[] = useMemo(() => {
    return generateAllFiles(config, selectedModules, currentBoard);
  }, [config, selectedModules, currentBoard]);

  // Handle configuration changes
  const handleChangeConfig = useCallback((updates: Partial<ProjectConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      if (updates.language && updates.language !== prev.language) {
        const langModuleMap: Record<string, string> = {
          c: 'lang-c',
          cpp: 'lang-cpp',
          rust: 'lang-rust',
        };
        const langModules = ['lang-c', 'lang-cpp', 'lang-rust'];
        const nonLang = prev.selectedModuleIds.filter((id) => !langModules.includes(id));
        next.selectedModuleIds = [langModuleMap[updates.language] || 'lang-c', ...nonLang];
      }
      return next;
    });
  }, []);

  // Handle module toggling (with automatic dependency resolution and language group exclusivity)
  const handleToggleModule = useCallback(
    (moduleId: string) => {
      setConfig((prev) => {
        const langModules = ['lang-c', 'lang-cpp', 'lang-rust'];

        if (langModules.includes(moduleId)) {
          // Mutually exclusive single selection for programming language modules
          const newLang = moduleId === 'lang-cpp' ? 'cpp' : (moduleId === 'lang-rust' ? 'rust' : 'c');
          const nonLang = prev.selectedModuleIds.filter((id) => !langModules.includes(id));
          return {
            ...prev,
            language: newLang,
            selectedModuleIds: [moduleId, ...nonLang],
          };
        }

        const isSelected = prev.selectedModuleIds.includes(moduleId);
        let updated: string[];

        if (isSelected) {
          updated = prev.selectedModuleIds.filter((id) => id !== moduleId);
        } else {
          updated = [...prev.selectedModuleIds, moduleId];

          // Auto-enable required dependencies if any
          const targetModule = modules.find((m) => m.id === moduleId);
          if (targetModule && targetModule.dependencies) {
            for (const depId of targetModule.dependencies) {
              if (!updated.includes(depId)) {
                updated.push(depId);
                const depMod = modules.find((m) => m.id === depId);
                addToast(
                  `Automatically enabled dependency "${depMod?.name || depId}" required by ${targetModule.name}`,
                  'info'
                );
              }
            }
          }
        }

        return { ...prev, selectedModuleIds: updated };
      });
    },
    [modules, addToast]
  );

  const handleRemoveModule = useCallback((moduleId: string) => {
    setConfig((prev) => {
      const langModules = ['lang-c', 'lang-cpp', 'lang-rust'];
      if (langModules.includes(moduleId)) {
        // If user tries to remove the active language module, reset back to C
        const nonLang = prev.selectedModuleIds.filter((id) => !langModules.includes(id));
        return {
          ...prev,
          language: 'c',
          selectedModuleIds: ['lang-c', ...nonLang],
        };
      }
      return {
        ...prev,
        selectedModuleIds: prev.selectedModuleIds.filter((id) => id !== moduleId),
      };
    });
  }, []);

  // Action Bar Handlers
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await downloadProjectZip(config, selectedModules, currentBoard);
      addToast(`Workspace archive "${config.name}.zip" successfully generated!`, 'success');
    } catch (err) {
      console.error('Error generating workspace zip:', err);
      addToast('Failed to generate zip file', 'warning');
    } finally {
      setIsGenerating(false);
    }
  }, [config, selectedModules, currentBoard, addToast]);

  const handleExplore = useCallback(() => {
    setIsExplorerOpen(true);
  }, []);

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}${encodeProjectState(config)}`;
    window.history.pushState(null, '', url);
    navigator.clipboard.writeText(url);
    addToast('Configuration URL copied to clipboard!', 'success');
  }, [config, addToast]);

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    addToast('Configuration reset to defaults', 'info');
  }, [addToast]);

  // Global Keyboard Shortcuts (Ctrl+Enter, Ctrl+Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text inputs
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'Space' && !isInput) {
        e.preventDefault();
        setIsExplorerOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate]);

  return (
    <div className="app-root">
      {/* Top Navbar */}
      <Header
        currentRelease={releases.find((r) => r.tag === config.zephyrVersion)}
        boardsCount={boards.length}
        apiSource={apiSource}
        rateLimitRemaining={rateLimitRemaining}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        onRefreshOnline={refreshResources}
        isRefreshing={isRefreshing}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="workspace-container">
          {/* Quick Info Banner */}
          <div className="info-banner">
            <div className="banner-icon-col">
              <Terminal className="icon-sm text-accent" />
            </div>
            <div className="banner-text-col">
              <strong>All-Inclusive West Manifests with Shallow Clones:</strong> Zephyr-Startr lists all upstream Zephyr modules in{' '}
              <code>name-allowlist</code>, actively enabling only the required HAL for{' '}
              <span className="text-light font-bold">
                {currentBoard ? currentBoard.name : config.boardId}
              </span>
              , {config.language === 'cpp' ? 'C++17' : (config.language === 'rust' ? 'Embedded Rust' : 'C')} support, and your enabled subsystems while commenting out unused repositories. Use{' '}
              <code>west update -n</code> for fast, shallow git clones.
            </div>
          </div>

          <div className="panels-flow">
            {/* 1. Project Settings: Name, Zephyr Release, Target Board, and Sample / Template Presets */}
            <ProjectSettings
              config={config}
              releases={releases}
              currentBoard={currentBoard}
              templates={DEFAULT_TEMPLATES}
              onChangeConfig={handleChangeConfig}
              onOpenBoardModal={() => setIsBoardModalOpen(true)}
            />

            {/* 2. Modules & Dependencies: Full Available Width */}
            <Dependencies
              modules={modules}
              selectedModuleIds={config.selectedModuleIds}
              onToggleModule={handleToggleModule}
              onRemoveModule={handleRemoveModule}
            />

            {/* 3. Kconfig Configuration & Overrides */}
            <KconfigEditor
              modules={selectedModules}
              customKconfig={config.customKconfig}
              onChangeCustomKconfig={(custom) => handleChangeConfig({ customKconfig: custom })}
            />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Action Bar */}
      <ActionBar
        config={config}
        board={currentBoard}
        selectedModulesCount={config.selectedModuleIds.length}
        onGenerate={handleGenerate}
        onExplore={handleExplore}
        onShare={handleShare}
        onReset={handleReset}
        isGenerating={isGenerating}
      />

      {/* Modals */}
      <BoardModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        boards={boards}
        selectedBoardId={config.boardId}
        onSelectBoard={(board) => handleChangeConfig({ boardId: board.id })}
      />

      <FileExplorerModal
        isOpen={isExplorerOpen}
        onClose={() => setIsExplorerOpen(false)}
        files={generatedFiles}
        config={config}
        onDownloadZip={handleGenerate}
      />

      <ApiTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onTokenUpdated={refreshResources}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default App;
