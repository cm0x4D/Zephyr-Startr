import React, { useState } from 'react';
import { Sliders, Plus, X, Check } from 'lucide-react';
import type { Module } from '../types';

interface KconfigEditorProps {
  modules: Module[];
  customKconfig: string[];
  onChangeCustomKconfig: (custom: string[]) => void;
}

export const KconfigEditor: React.FC<KconfigEditorProps> = ({
  modules,
  customKconfig,
  onChangeCustomKconfig,
}) => {
  const [newLine, setNewLine] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawText, setRawText] = useState(customKconfig.join('\n'));

  const handleAdd = () => {
    const trimmed = newLine.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('CONFIG_')) {
      setErrorMsg('Kconfig options typically start with CONFIG_ (e.g. CONFIG_MAIN_STACK_SIZE=2048)');
      return;
    }
    if (!trimmed.includes('=')) {
      setErrorMsg('Kconfig options should have a value (e.g. =y, =n, =1024, ="string")');
      return;
    }

    if (customKconfig.includes(trimmed)) {
      setErrorMsg('This option is already in your custom list');
      return;
    }

    setErrorMsg('');
    const updated = [...customKconfig, trimmed];
    onChangeCustomKconfig(updated);
    setRawText(updated.join('\n'));
    setNewLine('');
  };

  const handleRemove = (index: number) => {
    const updated = customKconfig.filter((_, i) => i !== index);
    onChangeCustomKconfig(updated);
    setRawText(updated.join('\n'));
  };

  const handleApplyRaw = () => {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));
    onChangeCustomKconfig(lines);
    setIsRawMode(false);
  };

  return (
    <section className="kconfig-panel">
      <div className="section-title-row">
        <div className="title-with-counter">
          <h2 className="section-title">
            <Sliders className="icon-sm text-accent" />
            Kconfig Configuration (prj.conf)
          </h2>
          <span className="counter-badge">{customKconfig.length} custom options</span>
        </div>
        <button
          type="button"
          className="btn-text-action"
          onClick={() => {
            if (!isRawMode) {
              setRawText(customKconfig.join('\n'));
            }
            setIsRawMode(!isRawMode);
          }}
        >
          {isRawMode ? 'Normal View' : 'Raw Text Mode'}
        </button>
      </div>

      <p className="section-desc">
        {modules.length} active modules generate base configuration. Add custom kernel options, buffer sizes, or stack sizes below.
      </p>

      {isRawMode ? (
        <div className="raw-kconfig-editor">
          <textarea
            className="raw-textarea"
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="# Enter one Kconfig option per line&#10;CONFIG_MAIN_STACK_SIZE=4096&#10;CONFIG_SYSTEM_WORKQUEUE_STACK_SIZE=2048"
          />
          <div className="raw-actions">
            <button type="button" className="btn-primary btn-sm" onClick={handleApplyRaw}>
              <Check className="icon-xs" /> Apply Custom Options
            </button>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => setIsRawMode(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="kconfig-builder">
          <div className="add-kconfig-row">
            <input
              type="text"
              className="kconfig-input"
              placeholder="e.g. CONFIG_MAIN_STACK_SIZE=4096 or CONFIG_CBPRINTF_FP_SUPPORT=y"
              value={newLine}
              onChange={(e) => {
                setNewLine(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <button type="button" className="btn-secondary btn-sm" onClick={handleAdd}>
              <Plus className="icon-xs" /> Add Option
            </button>
          </div>

          {errorMsg && <div className="kconfig-error">{errorMsg}</div>}

          {customKconfig.length > 0 && (
            <div className="custom-kconfig-list">
              <span className="custom-kconfig-label">Your Custom Overrides:</span>
              <div className="custom-kconfig-chips">
                {customKconfig.map((line, idx) => (
                  <span key={idx} className="kconfig-chip">
                    <code>{line}</code>
                    <button
                      type="button"
                      className="kconfig-chip-remove"
                      onClick={() => handleRemove(idx)}
                      title="Remove option"
                    >
                      <X className="icon-xs" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick recommendations */}
          <div className="kconfig-presets">
            <span className="quick-label">Common Overrides:</span>
            {[
              'CONFIG_MAIN_STACK_SIZE=4096',
              'CONFIG_CBPRINTF_FP_SUPPORT=y',
              'CONFIG_ASSERT=y',
              'CONFIG_HEAP_MEM_POOL_SIZE=8192',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                className={`quick-chip ${customKconfig.includes(preset) ? 'active' : ''}`}
                onClick={() => {
                  if (!customKconfig.includes(preset)) {
                    onChangeCustomKconfig([...customKconfig, preset]);
                  }
                }}
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
