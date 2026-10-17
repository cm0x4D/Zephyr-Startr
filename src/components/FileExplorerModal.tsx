import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Folder, File, FileCode, FileText } from 'lucide-react';
import type { GeneratedFile, ProjectConfig } from '../types';

interface FileExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: GeneratedFile[];
  config: ProjectConfig;
  onDownloadZip: () => void;
}

export const FileExplorerModal: React.FC<FileExplorerModalProps> = ({
  isOpen,
  onClose,
  files,
  config,
  onDownloadZip,
}) => {
  const [activeFilePath, setActiveFilePath] = useState<string>('prj.conf');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const activeFile = files.find((f) => f.path === activeFilePath) || files[0];

  const handleCopy = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.c') || name.endsWith('.h') || name.endsWith('.cpp') || name.endsWith('.rs')) {
      return <FileCode className="tree-file-icon text-accent" />;
    }
    if (name.endsWith('.yml') || name.endsWith('.yaml') || name.endsWith('.toml')) {
      return <FileText className="tree-file-icon text-warning" />;
    }
    if (name === 'CMakeLists.txt') {
      return <FileText className="tree-file-icon text-info" />;
    }
    if (name.endsWith('.conf')) {
      return <FileText className="tree-file-icon text-success" />;
    }
    if (name.endsWith('.md')) {
      return <FileText className="tree-file-icon text-info" />;
    }
    return <File className="tree-file-icon text-muted" />;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog explorer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Folder className="icon-md text-accent" />
            <div>
              <h2 className="modal-title">Explore Project Workspace</h2>
              <p className="modal-subtitle">
                Inspect generated files, West manifest, and C source code before downloading
              </p>
            </div>
          </div>

          <div className="modal-actions-right">
            <button type="button" className="btn-primary btn-sm" onClick={onDownloadZip}>
              <Download className="icon-xs" /> Download ZIP
            </button>
            <button type="button" className="btn-close" onClick={onClose}>
              <X className="icon-sm" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view */}
        <div className="explorer-split">
          {/* Left: File Tree */}
          <div className="explorer-sidebar">
            <div className="sidebar-header">
              <span className="sidebar-title">Project Files</span>
            </div>

            <div className="file-tree">
              <div className="tree-folder-root">
                <Folder className="icon-xs text-accent" />
                <span className="folder-name">{config.name}</span>
              </div>

              <div className="tree-children">
                {files.map((file) => {
                  const isSelected = file.path === activeFile?.path;
                  return (
                    <button
                      key={file.path}
                      type="button"
                      className={`tree-item ${isSelected ? 'active' : ''}`}
                      onClick={() => setActiveFilePath(file.path)}
                    >
                      {getFileIcon(file.name)}
                      <span className="tree-item-label">{file.path}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Code Viewer */}
          <div className="explorer-viewer">
            {activeFile ? (
              <>
                <div className="viewer-header">
                  <div className="viewer-breadcrumbs">
                    <span className="text-muted">{config.name} /</span>
                    <span className="text-light font-mono">{activeFile.path}</span>
                  </div>

                  <div className="viewer-actions">
                    <span className="viewer-stat">
                      {activeFile.content.split('\n').length} lines •{' '}
                      {new Blob([activeFile.content]).size} bytes
                    </span>
                    <button
                      type="button"
                      className="btn-secondary btn-xs copy-btn"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check className="icon-xs text-success" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="icon-xs" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="code-container">
                  <pre className="code-pre">
                    <code>
                      {activeFile.content.split('\n').map((line, idx) => (
                        <div key={idx} className="code-line">
                          <span className="line-number">{idx + 1}</span>
                          <span className="line-content">{line}</span>
                        </div>
                      ))}
                    </code>
                  </pre>
                </div>
              </>
            ) : (
              <div className="empty-viewer">Select a file to preview</div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="modal-footer">
          <span className="text-muted text-sm">
            Press <kbd className="key-hint">Esc</kbd> to close, or <kbd className="key-hint">Ctrl + ⏎</kbd> to generate
          </span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
