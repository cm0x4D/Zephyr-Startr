import React, { useState } from 'react';
import { X, Key, ShieldCheck, Check } from 'lucide-react';
import { getStoredGitHubToken, setStoredGitHubToken } from '../services/zephyrApi';

interface ApiTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenUpdated: () => void;
}

export const ApiTokenModal: React.FC<ApiTokenModalProps> = ({
  isOpen,
  onClose,
  onTokenUpdated,
}) => {
  const [token, setToken] = useState(getStoredGitHubToken());
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setStoredGitHubToken(token.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onTokenUpdated();
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    setStoredGitHubToken('');
    setToken('');
    onTokenUpdated();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog token-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <Key className="icon-md text-accent" />
            <div>
              <h2 className="modal-title">GitHub API Settings</h2>
              <p className="modal-subtitle">
                Provide an optional personal access token for up to 5,000 requests/hour
              </p>
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            <X className="icon-sm" />
          </button>
        </div>

        <div className="modal-body">
          <div className="token-info-alert">
            <ShieldCheck className="icon-sm text-success" />
            <div className="alert-content">
              <strong>Your token is stored only in your local browser (localStorage).</strong>
              <p>It is never sent to any backend server. No special scopes or permissions are required (public read-only access).</p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ghToken">
              GitHub Personal Access Token (classic or fine-grained)
            </label>
            <input
              id="ghToken"
              type="password"
              className="text-input font-mono"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          {token && (
            <button type="button" className="btn-secondary" onClick={handleClear}>
              Remove Token
            </button>
          )}
          <div className="footer-right">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={handleSave}>
              {saved ? (
                <>
                  <Check className="icon-xs" /> Saved!
                </>
              ) : (
                'Save Token'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
