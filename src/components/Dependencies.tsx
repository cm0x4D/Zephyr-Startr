import React, { useState, useMemo } from 'react';
import { Search, Plus, Check, X, Box } from 'lucide-react';
import type { Module } from '../types';

interface DependenciesProps {
  modules: Module[];
  selectedModuleIds: string[];
  onToggleModule: (moduleId: string) => void;
  onRemoveModule: (moduleId: string) => void;
}

export const Dependencies: React.FC<DependenciesProps> = ({
  modules,
  selectedModuleIds,
  onToggleModule,
  onRemoveModule,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const m of modules) {
      if (m.category && m.category !== 'Programming Languages') set.add(m.category);
    }
    const hasLang = modules.some((m) => m.category === 'Programming Languages');
    const sorted = Array.from(set).sort();
    return hasLang ? ['All', 'Programming Languages', ...sorted] : ['All', ...sorted];
  }, [modules]);

  const selectedSet = useMemo(() => new Set(selectedModuleIds), [selectedModuleIds]);

  const selectedModules = useMemo(() => {
    return modules.filter((m) => selectedSet.has(m.id));
  }, [modules, selectedSet]);

  const filteredModules = useMemo(() => {
    const q = query.toLowerCase().trim();
    return modules.filter((m) => {
      if (activeCategory !== 'All' && m.category !== activeCategory) {
        return false;
      }
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [modules, query, activeCategory]);

  return (
    <section className="dependencies-panel">
      <div className="section-title-row">
        <div className="title-with-counter">
          <h2 className="section-title">
            <Box className="icon-sm text-accent" />
            Modules & Dependencies
          </h2>
          <span className="counter-badge">{selectedModuleIds.length} enabled</span>
        </div>
        <span className="section-badge">Step 2</span>
      </div>

      {/* Selected Modules Tray */}
      {selectedModules.length > 0 && (
        <div className="selected-tray">
          <div className="tray-header">
            <span className="tray-label">Active Modules:</span>
            <span className="tray-hint">Click &times; to remove</span>
          </div>
          <div className="tray-chips">
            {selectedModules.map((m) => (
              <span key={m.id} className="selected-chip">
                <span className="chip-text">{m.name}</span>
                {m.westModules && m.westModules.length > 0 && (
                  <span className="chip-west-tag" title={`Adds west project: ${m.westModules.join(', ')}`}>
                    +{m.westModules[0]}
                  </span>
                )}
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => onRemoveModule(m.id)}
                  title={`Remove ${m.name}`}
                >
                  <X className="icon-xs" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="dep-search-row">
        <div className="search-input-wrapper">
          <Search className="search-icon icon-sm" />
          <input
            type="text"
            className="search-input"
            placeholder="Search modules (e.g. logging, wifi, ble, sensor, rust, cpp, fatfs, mbedtls, lvgl)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="search-clear-btn" onClick={() => setQuery('')}>
              <X className="icon-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="category-scroll">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`cat-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modules List */}
      <div className="modules-list">
        {filteredModules.map((m) => {
          const isSelected = selectedSet.has(m.id);
          const isLang = m.category === 'Programming Languages';
          const hasMissingDeps =
            m.dependencies &&
            m.dependencies.some((depId) => !selectedSet.has(depId));
          const catClass = `cat-${m.category.toLowerCase().replace(/\s+/g, '-')}`;

          return (
            <div
              key={m.id}
              className={`module-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggleModule(m.id)}
            >
              <div className="module-main">
                <div className="module-title-row">
                  <div className="module-name-group">
                    <span className="module-name">{m.name}</span>
                    <span className={`category-tag ${catClass}`}>
                      {m.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`module-action-btn ${isSelected ? 'added' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleModule(m.id);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check className="icon-xs" /> {isLang ? 'Active Language' : 'Added'}
                      </>
                    ) : (
                      <>
                        <Plus className="icon-xs" /> {isLang ? 'Select' : 'Add'}
                      </>
                    )}
                  </button>
                </div>

                <p className="module-desc">{m.description}</p>

                <div className="module-meta-row">
                  {m.westModules && m.westModules.length > 0 && (
                    <span className="meta-badge west" title="Adds git repository to West manifest allowlist">
                      West: {m.westModules.join(', ')}
                    </span>
                  )}
                  {m.dependencies && m.dependencies.length > 0 && (
                    <span className={`meta-badge dep ${hasMissingDeps && isSelected ? 'warning' : ''}`}>
                      Requires: {m.dependencies.join(', ')}
                    </span>
                  )}
                  {m.kconfig.length > 0 ? (
                    <span className="meta-kconfig-preview" title={m.kconfig.join('\n')}>
                      {m.kconfig[0]}
                      {m.kconfig.length > 1 ? ` (+${m.kconfig.length - 1})` : ''}
                    </span>
                  ) : (
                    <span className="meta-kconfig-preview">
                      Entry: {m.id === 'lang-rust' ? 'src/lib.rs' : (m.id === 'lang-cpp' ? 'src/main.cpp' : 'src/main.c')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredModules.length === 0 && (
          <div className="no-modules">
            <p>No modules found matching "{query}".</p>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setQuery('');
                setActiveCategory('All');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
