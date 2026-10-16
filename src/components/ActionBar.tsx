import React from 'react';
import { Download, FolderTree, Share2, RotateCcw } from 'lucide-react';
import type { Board, ProjectConfig } from '../types';

interface ActionBarProps {
  config: ProjectConfig;
  board?: Board;
  selectedModulesCount: number;
  onGenerate: () => void;
  onExplore: () => void;
  onShare: () => void;
  onReset: () => void;
  isGenerating: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  config,
  board,
  selectedModulesCount,
  onGenerate,
  onExplore,
  onShare,
  onReset,
  isGenerating,
}) => {
  return (
    <footer className="action-bar">
      <div className="action-bar-container">
        {/* Left: Summary info */}
        <div className="action-summary">
          <div className="summary-app-info">
            <span className="summary-name">{config.name}</span>
            <span className="summary-dot">•</span>
            <span className="summary-board" title={config.boardId}>
              {board ? board.name : config.boardId}
            </span>
            <span className="summary-dot">•</span>
            <span className="summary-version">{config.zephyrVersion}</span>
            <span className="summary-dot">•</span>
            <span className="summary-modules">{selectedModulesCount} modules</span>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="action-buttons">
          <button
            type="button"
            className="action-btn btn-secondary"
            onClick={onReset}
            title="Reset configuration to default"
          >
            <RotateCcw className="icon-xs" />
            <span className="btn-label">Reset</span>
          </button>

          <button
            type="button"
            className="action-btn btn-secondary"
            onClick={onShare}
            title="Share configuration via URL"
          >
            <Share2 className="icon-xs" />
            <span className="btn-label">Share</span>
          </button>

          <button
            type="button"
            className="action-btn btn-dark"
            onClick={onExplore}
            title="Explore workspace files (Ctrl + Space)"
          >
            <FolderTree className="icon-xs text-accent" />
            <span className="btn-label">Explore</span>
            <kbd className="key-hint">Ctrl + Space</kbd>
          </button>

          <button
            type="button"
            className="action-btn btn-primary generate-btn"
            onClick={onGenerate}
            disabled={isGenerating}
            title="Generate & download West workspace zip (Ctrl + Enter)"
          >
            <Download className={`icon-sm ${isGenerating ? 'spin' : ''}`} />
            <span className="btn-label">Generate Project</span>
            <kbd className="key-hint primary-hint">Ctrl + ⏎</kbd>
          </button>
        </div>
      </div>
    </footer>
  );
};
