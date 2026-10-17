import React from 'react';
import { Cpu, Layers, Check, ChevronDown, Package, FileCode2, HelpCircle } from 'lucide-react';
import type { Board, ProjectConfig, ProjectTemplate, Release } from '../types';

interface ProjectSettingsProps {
  config: ProjectConfig;
  releases: Release[];
  currentBoard?: Board;
  templates: ProjectTemplate[];
  onChangeConfig: (updates: Partial<ProjectConfig>) => void;
  onOpenBoardModal: () => void;
}

const POPULAR_BOARDS = [
  { id: 'nrf52840dk/nrf52840', label: 'Nordic nRF52840 DK', vendor: 'Nordic' },
  { id: 'esp32_devkitc_wroom', label: 'ESP32 DevKitC', vendor: 'Espressif' },
  { id: 'nucleo_f401re', label: 'STM32 Nucleo F401RE', vendor: 'ST' },
  { id: 'rpi_pico', label: 'Raspberry Pi Pico', vendor: 'Raspberry Pi' },
  { id: 'native_sim', label: 'POSIX Simulator', vendor: 'Linux/macOS' },
];

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({
  config,
  releases,
  currentBoard,
  templates,
  onChangeConfig,
  onOpenBoardModal,
}) => {
  // Key releases to display prominently
  const prominentReleases = releases.slice(0, 4);
  const otherReleases = releases.slice(4);

  return (
    <section className="settings-panel">
      <div className="section-title-row">
        <h2 className="section-title">
          <Layers className="icon-sm text-accent" />
          Project Configuration
        </h2>
        <span className="section-badge">Step 1</span>
      </div>

      <div className="form-grid">
        {/* Project Name and Release Row */}
        <div className="form-row-2col">
          {/* Project Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="projectName">
              Project Name / Artifact
            </label>
            <div className="input-wrap">
              <input
                id="projectName"
                type="text"
                className="text-input"
                value={config.name}
                placeholder="my-zephyr-app"
                onChange={(e) => {
                  const safe = e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
                  onChangeConfig({ name: safe });
                }}
              />
            </div>
            <span className="form-hint">Identifier used for West workspace directory and CMake project name</span>
          </div>

          {/* Zephyr Release */}
          <div className="form-group">
            <label className="form-label">Zephyr Release Version</label>
            <div className="pill-group">
              {prominentReleases.map((rel) => {
                const isSelected = config.zephyrVersion === rel.tag;
                return (
                  <button
                    key={rel.tag}
                    type="button"
                    className={`pill-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => onChangeConfig({ zephyrVersion: rel.tag })}
                  >
                    <span className="pill-title">{rel.tag}</span>
                    {rel.lts && <span className="pill-badge lts">LTS</span>}
                    {rel.isLatest && <span className="pill-badge latest">Latest</span>}
                    {rel.isBranch && <span className="pill-badge dev">Dev</span>}
                  </button>
                );
              })}

              {otherReleases.length > 0 && (
                <div className="select-wrapper">
                  <select
                    className="pill-select"
                    value={
                      prominentReleases.some((r) => r.tag === config.zephyrVersion)
                        ? ''
                        : config.zephyrVersion
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        onChangeConfig({ zephyrVersion: e.target.value });
                      }
                    }}
                  >
                    <option value="" disabled>
                      More versions...
                    </option>
                    {otherReleases.map((rel) => (
                      <option key={rel.tag} value={rel.tag}>
                        {rel.tag} {rel.lts ? '(LTS)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="select-arrow icon-xs" />
                </div>
              )}
            </div>
            <span className="form-hint">
              Upstream Zephyr git revision checked out into workspace during <code>west update -n</code>
            </span>
          </div>
        </div>

        {/* Workspace Mode / Packaging */}
        <div className="form-group full-width">
          <div className="label-with-hint">
            <label className="form-label">Packaging & Workspace Structure</label>
            <span className="form-hint-badge">Choose how your project is bundled</span>
          </div>

          <div className="workspace-toggle-grid">
            <button
              type="button"
              className={`workspace-card ${config.workspaceType === 'standalone' ? 'selected' : ''}`}
              onClick={() => onChangeConfig({ workspaceType: 'standalone' })}
            >
              <div className="workspace-card-header">
                <div className="workspace-icon-box">
                  <Package className="icon-sm text-accent" />
                </div>
                <div className="workspace-title-box">
                  <span className="workspace-title">Dedicated Workspace</span>
                  <span className="workspace-badge recommended">New Workspace</span>
                </div>
                {config.workspaceType === 'standalone' && <Check className="icon-xs text-accent check-icon" />}
              </div>
              <p className="workspace-desc">
                Contains a complete standalone Zephyr workspace structure with an allowlisted <code>app/west.yml</code> manifest, <code>app/</code> source folder, <code>.gitignore</code>, and workspace initialization guide.
              </p>
              <div className="workspace-perks">
                <span className="perk-tag">Independent repository</span>
                <span className="perk-tag">Minimal clone allowlist</span>
                <span className="perk-tag">.venv at workspace root</span>
              </div>
            </button>

            <button
              type="button"
              className={`workspace-card ${config.workspaceType === 'application' ? 'selected' : ''}`}
              onClick={() => onChangeConfig({ workspaceType: 'application' })}
            >
              <div className="workspace-card-header">
                <div className="workspace-icon-box">
                  <FileCode2 className="icon-sm text-accent" />
                </div>
                <div className="workspace-title-box">
                  <span className="workspace-title">Application Only</span>
                  <span className="workspace-badge existing">Existing Workspace</span>
                </div>
                {config.workspaceType === 'application' && <Check className="icon-xs text-accent check-icon" />}
              </div>
              <p className="workspace-desc">
                Generates only application files (<code>CMakeLists.txt</code>, <code>prj.conf</code>, <code>src/main.c</code>, <code>sample.yaml</code>) to drop directly into an already existing Zephyr workspace.
              </p>
              <div className="workspace-perks">
                <span className="perk-tag">No duplicate West setup</span>
                <span className="perk-tag">Zero extra download</span>
                <span className="perk-tag">Uses existing .venv</span>
              </div>
            </button>
          </div>

          <div className="workspace-explanation-callout">
            <HelpCircle className="icon-sm text-accent callout-icon" />
            <div className="callout-content">
              <strong className="callout-heading">Adding to an existing workspace vs. creating a new one:</strong>
              <div className="callout-items">
                <div className="callout-item">
                  <span className="callout-bullet">•</span>
                  <span>
                    <strong>Dedicated Workspace (Standalone):</strong> Choose this when starting a brand new project. West will initialize an isolated workspace directory, set up <code>.venv</code> at the root, and clone only the specific Zephyr HAL and modules you enabled without touching other projects.
                  </span>
                </div>
                <div className="callout-item">
                  <span className="callout-bullet">•</span>
                  <span>
                    <strong>Application Only (Existing Workspace):</strong> Choose this if you already have Zephyr installed and working on your machine (e.g. in <code>~/zephyrproject</code>). You simply extract this application folder into your workspace and compile immediately using your existing workspace's <code>.venv</code> without downloading another copy of the OS.
                  </span>
                </div>
              </div>
              <div className="callout-note">
                <strong>Python Virtual Environment:</strong> In both options, the virtual environment is the <code>.venv</code> folder located directly at the root of the Zephyr workspace folder.
              </div>
            </div>
          </div>
        </div>

        {/* Programming Language Selector */}
        <div className="form-group full-width">
          <div className="label-with-hint">
            <label className="form-label">Programming Language</label>
            <span className="form-hint-badge">Single selection (C, C++, or Rust)</span>
          </div>

          <div className="language-toggle-grid">
            <button
              type="button"
              className={`lang-card ${config.language === 'c' ? 'selected' : ''}`}
              onClick={() => onChangeConfig({ language: 'c' })}
            >
              <div className="lang-card-header">
                <span className="lang-title">C Language</span>
                {config.language === 'c' && <Check className="icon-xs text-accent" />}
              </div>
              <span className="lang-sub">Standard C99 / C11</span>
              <p className="lang-desc">Standard embedded C (<code>main.c</code>) using native Zephyr RTOS system calls and kernel APIs.</p>
            </button>

            <button
              type="button"
              className={`lang-card ${config.language === 'cpp' ? 'selected' : ''}`}
              onClick={() => onChangeConfig({ language: 'cpp' })}
            >
              <div className="lang-card-header">
                <span className="lang-title">C++ Language</span>
                {config.language === 'cpp' && <Check className="icon-xs text-accent" />}
              </div>
              <span className="lang-sub">Modern C++17 / C++20</span>
              <p className="lang-desc">Modern C++ embedded development (<code>main.cpp</code>) with <code>CONFIG_CPP=y</code>, classes, and STL support.</p>
            </button>

            <button
              type="button"
              className={`lang-card ${config.language === 'rust' ? 'selected' : ''}`}
              onClick={() => onChangeConfig({ language: 'rust' })}
            >
              <div className="lang-card-header">
                <span className="lang-title">Rust Language</span>
                {config.language === 'rust' && <Check className="icon-xs text-accent" />}
              </div>
              <span className="lang-sub">Bare-Metal no_std</span>
              <p className="lang-desc">Memory-safe systems programming (<code>src/lib.rs</code>, <code>Cargo.toml</code>) with <code>CONFIG_RUST=y</code>.</p>
            </button>
          </div>
        </div>

        {/* Target Board */}
        <div className="form-group full-width">
          <div className="board-label-row">
            <label className="form-label">Target Hardware Board</label>
            <button
              type="button"
              className="btn-link-action"
              onClick={onOpenBoardModal}
            >
              Browse all 1,750+ boards →
            </button>
          </div>

          <div className="board-preview-card">
            <div className="board-preview-main">
              <div className="board-icon-box">
                <Cpu className="icon-md text-accent" />
              </div>
              <div className="board-preview-info">
                <div className="board-name-row">
                  <h3 className="board-preview-title">
                    {currentBoard ? currentBoard.name : config.boardId}
                  </h3>
                  <code className="board-target-code">{config.boardId}</code>
                </div>
                {currentBoard && (
                  <p className="board-preview-sub">
                    {currentBoard.vendor} • {currentBoard.arch.toUpperCase()} Architecture
                    {currentBoard.description ? ` • ${currentBoard.description}` : ''}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={onOpenBoardModal}
            >
              Change Board
            </button>
          </div>

          {/* Quick-pick popular boards */}
          <div className="quick-boards">
            <span className="quick-label">Popular:</span>
            {POPULAR_BOARDS.map((pb) => (
              <button
                key={pb.id}
                type="button"
                className={`quick-chip ${config.boardId === pb.id ? 'active' : ''}`}
                onClick={() => onChangeConfig({ boardId: pb.id })}
              >
                {pb.label}
              </button>
            ))}
          </div>
        </div>

        {/* Application Template Preset */}
        <div className="form-group full-width">
          <label className="form-label">
            Application Preset / Template
          </label>
          <div className="template-grid">
            {templates.map((tpl) => {
              const isSelected = config.templateId === tpl.id;
              return (
                <div
                  key={tpl.id}
                  className={`template-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    // Update template and preselect recommended modules
                    const updatedModuleIds = Array.from(
                      new Set([...config.selectedModuleIds, ...tpl.recommendedModules])
                    );
                    onChangeConfig({
                      templateId: tpl.id,
                      selectedModuleIds: updatedModuleIds,
                    });
                  }}
                >
                  <div className="template-header">
                    <span className="template-name">{tpl.name}</span>
                    {isSelected && <Check className="icon-xs text-accent" />}
                  </div>
                  <p className="template-desc">{tpl.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
