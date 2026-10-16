import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Check, CircuitBoard } from 'lucide-react';
import type { Board } from '../types';

interface BoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  boards: Board[];
  selectedBoardId: string;
  onSelectBoard: (board: Board) => void;
}

export const BoardModal: React.FC<BoardModalProps> = ({
  isOpen,
  onClose,
  boards,
  selectedBoardId,
  onSelectBoard,
}) => {
  const [query, setQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('All');
  const [selectedArch, setSelectedArch] = useState('All');

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

  // Extract popular vendors
  const topVendors = [
    'All',
    'Nordic Semiconductor',
    'STMicroelectronics',
    'Espressif Systems',
    'Raspberry Pi',
    'NXP Semiconductors',
    'Texas Instruments',
    'Silicon Labs',
    'POSIX / Simulator',
  ];

  const architectures = ['All', 'arm', 'riscv', 'xtensa', 'x86', 'posix'];

  const filteredBoards = useMemo(() => {
    const q = query.toLowerCase().trim();
    return boards.filter((b) => {
      if (selectedVendor !== 'All' && b.vendor !== selectedVendor) {
        return false;
      }
      if (selectedArch !== 'All' && b.arch !== selectedArch) {
        return false;
      }
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.vendor.toLowerCase().includes(q) ||
        (b.description && b.description.toLowerCase().includes(q))
      );
    });
  }, [boards, query, selectedVendor, selectedArch]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog board-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <CircuitBoard className="icon-md text-accent" />
            <div>
              <h2 className="modal-title">Select Target Hardware Board</h2>
              <p className="modal-subtitle">
                Search over {boards.length.toLocaleString()} verified Zephyr boards and dev kits
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X className="icon-sm" />
          </button>
        </div>

        <div className="modal-search-row">
          <div className="search-input-wrapper">
            <Search className="search-icon icon-sm" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by board name, SoC, vendor, or target (e.g. nrf52840dk, esp32, nucleo, pico)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button type="button" className="search-clear-btn" onClick={() => setQuery('')}>
                <X className="icon-xs" />
              </button>
            )}
          </div>
        </div>

        <div className="modal-filter-row">
          <div className="filter-group">
            <span className="filter-label">Vendor:</span>
            <div className="filter-chips">
              {topVendors.map((vendor) => (
                <button
                  key={vendor}
                  type="button"
                  className={`chip ${selectedVendor === vendor ? 'active' : ''}`}
                  onClick={() => setSelectedVendor(vendor)}
                >
                  {vendor === 'Nordic Semiconductor' ? 'Nordic' : vendor === 'STMicroelectronics' ? 'STM32' : vendor === 'Espressif Systems' ? 'Espressif' : vendor}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-label">Arch:</span>
            <div className="filter-chips">
              {architectures.map((arch) => (
                <button
                  key={arch}
                  type="button"
                  className={`chip ${selectedArch === arch ? 'active' : ''}`}
                  onClick={() => setSelectedArch(arch)}
                >
                  {arch.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-results-count">
          Showing {filteredBoards.length.toLocaleString()} of {boards.length.toLocaleString()} boards
        </div>

        <div className="board-grid">
          {filteredBoards.slice(0, 100).map((board) => {
            const isSelected = board.id === selectedBoardId;
            return (
              <div
                key={board.id}
                className={`board-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onSelectBoard(board);
                  onClose();
                }}
              >
                <div className="board-card-header">
                  <div className="board-card-title-group">
                    <h3 className="board-card-title">{board.name}</h3>
                    <code className="board-card-id">{board.id}</code>
                  </div>
                  {isSelected && (
                    <span className="badge-selected">
                      <Check className="icon-xs" /> Selected
                    </span>
                  )}
                </div>

                {board.description && <p className="board-card-desc">{board.description}</p>}

                <div className="board-card-tags">
                  <span className="tag-vendor">{board.vendor}</span>
                  <span className="tag-arch">{board.arch.toUpperCase()}</span>
                  {board.popular && <span className="tag-popular">Popular</span>}
                </div>
              </div>
            );
          })}

          {filteredBoards.length === 0 && (
            <div className="no-results">
              <p>No boards found matching "{query}".</p>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={() => {
                  setQuery('');
                  setSelectedVendor('All');
                  setSelectedArch('All');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <span className="text-muted text-sm">
            Can't find a custom board? You can always enter any custom board target identifier directly.
          </span>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
