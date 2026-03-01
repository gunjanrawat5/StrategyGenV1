import './GamePreview.css';

interface StrategyResponse {
  status: string;
  objective_summary: string;
  steps: Array<{
    step_number: number;
    title: string;
    action_items: string[];
    expected_outcome: string;
  }>;
  estimated_timeline: string;
}

type GamePreviewProps = {
  response: StrategyResponse | null;
  loading: boolean;
  error: string | null;
};

export default function GamePreview({ response, loading, error }: GamePreviewProps) {
  if (error) {
    return (
      <section className="game-preview">
        <div className="preview-error">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="game-preview">
        <div className="preview-loading">
          <div className="spinner"></div>
          <p>Generating Strategy...</p>
        </div>
      </section>
    );
  }

  if (!response) {
    return (
      <section className="game-preview">
        <div className="preview-placeholder">
          <div className="placeholder-content">
            <h2>Strategic Plan</h2>
            <p>Enter objective and context, then click GEN to generate your strategy</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="game-preview">
      <div className="preview-container">
        <div className="preview-header">
          <h2>Strategic Plan</h2>
          <div className="timeline-badge">
            <span className="timeline-icon">🕐</span>
            <span>Timeline</span>
          </div>
        </div>

        <div className="phases-container">
          {response.steps.map((step) => (
            <div key={step.step_number} className="phase-card">
              <div className="phase-header">
                <span className="phase-star">★</span>
                <span className="phase-title">Phase {step.step_number}</span>
              </div>
              <div className="phase-content">
                <div className="phase-subtitle">{step.title}</div>
                <div className="progress-bars">
                  {step.action_items.slice(0, 3).map((_, idx) => (
                    <div key={idx} className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(idx + 1) * 30}%` }}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}