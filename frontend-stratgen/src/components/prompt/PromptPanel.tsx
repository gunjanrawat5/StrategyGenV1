import './PromptPanel.css';
import { useState } from 'react';

type PromptPanelProps = {
  onGenerate: (objective: string, context: string, useAdvanced: boolean, temperature: number) => void;
  loading: boolean;
};

export default function PromptPanel({ onGenerate, loading }: PromptPanelProps) {
  const [objective, setObjective] = useState('');
  const [context, setContext] = useState('');
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [temperature, setTemperature] = useState(0.7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (objective.trim()) {
      onGenerate(objective, context, useAdvanced, temperature);
    }
  };

  return (
    <section className="prompt-panel">
      <div className="window-frame">
        <div className="window-header">
          <div className="window-controls">
            <span className="control-dot red"></span>
            <span className="control-dot yellow"></span>
            <span className="control-dot green"></span>
          </div>
          <div className="window-title">StrategyGen UI</div>
          <div className="window-actions">
            <span>−</span>
            <span>□</span>
            <span>×</span>
          </div>
        </div>

        <div className="window-content">
          <div className="panel-header">
            <div className="header-icon">◈</div>
            <h2>StrategyGen UI</h2>
          </div>

          <form onSubmit={handleSubmit} className="prompt-form">
            <div className="form-field">
              <label>Strategic Objective</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder=""
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="form-field">
              <label>Context</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder=""
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="form-field-inline">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={useAdvanced}
                  onChange={(e) => setUseAdvanced(e.target.checked)}
                  disabled={loading}
                />
                <span className="toggle-switch"></span>
                <span className="toggle-text">Featherless/Advanced AI</span>
              </label>
            </div>

            <button type="submit" className="gen-button" disabled={loading || !objective.trim()}>
              {loading ? 'GENERATING...' : 'GEN'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}