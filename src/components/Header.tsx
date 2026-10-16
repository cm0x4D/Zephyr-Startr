import React from 'react';
import { ExternalLink, Key, RefreshCw, BookOpen, Cpu } from 'lucide-react';
import type { Release } from '../types';

interface HeaderProps {
  currentRelease?: Release;
  boardsCount: number;
  apiSource: 'api' | 'cached' | 'bundled';
  rateLimitRemaining?: number;
  onOpenTokenModal: () => void;
  onRefreshOnline: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentRelease,
  boardsCount,
  apiSource,
  rateLimitRemaining,
  onOpenTokenModal,
  onRefreshOnline,
  isRefreshing,
}) => {
  return (
    <header className="site-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="logo-badge">
            <Cpu className="logo-svg" />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1 className="brand-title">Zephyr-Startr</h1>
              <span className="brand-tag">Project Generator for Zephyr RTOS</span>
            </div>
            <p className="brand-subtitle">
              Instantly configure, minimize West manifests, and generate ready-to-flash Zephyr workspaces
            </p>
          </div>
        </div>

        <div className="header-meta">
          <div className="online-badge" title={`Data source: ${apiSource} • Target: ${currentRelease?.tag || 'main'}`}>
            <span className={`status-dot ${apiSource === 'api' ? 'online' : 'cached'}`} />
            <span className="status-label">
              {currentRelease?.tag || 'Zephyr'} ({boardsCount.toLocaleString()} boards)
            </span>
            {rateLimitRemaining !== undefined && (
              <span className="ratelimit-tag" title="GitHub API requests remaining this hour">
                {rateLimitRemaining}/60 reqs
              </span>
            )}
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn-icon"
              onClick={onRefreshOnline}
              disabled={isRefreshing}
              title="Refresh online resources from GitHub"
            >
              <RefreshCw className={`icon-sm ${isRefreshing ? 'spin' : ''}`} />
              <span className="btn-text">Sync</span>
            </button>

            <button
              type="button"
              className="btn-icon"
              onClick={onOpenTokenModal}
              title="Configure GitHub API Token (bypass rate limits)"
            >
              <Key className="icon-sm" />
              <span className="btn-text">API Key</span>
            </button>

            <a
              href="https://docs.zephyrproject.org/latest/develop/getting_started/index.html"
              target="_blank"
              rel="noreferrer"
              className="btn-icon btn-link"
              title="Zephyr Getting Started Guide"
            >
              <BookOpen className="icon-sm" />
              <span className="btn-text">Zephyr Docs</span>
            </a>

            <a
              href="https://github.com/zephyrproject-rtos/zephyr"
              target="_blank"
              rel="noreferrer"
              className="btn-icon btn-link"
              title="Official Zephyr Repository"
            >
              <ExternalLink className="icon-sm" />
              <span className="btn-text">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
