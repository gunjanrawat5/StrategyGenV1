import { useState } from 'react';
import PromptPanel from '../components/prompt/PromptPanel';
import GamePreview from '../components/game/GamePreview';
import './StrategyGeneratorPage.css';

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

export default function StrategyGeneratorPage() {
  const [response, setResponse] = useState<StrategyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (objective: string, context: string, useAdvanced: boolean, temperature: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiUrl}/api/generate-strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          objective,
          context,
          target_audience: '',
          model_temperature: temperature,
          use_advanced_planner: useAdvanced,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: StrategyResponse = await response.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error generating strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="strategy-generator-page">
      <PromptPanel onGenerate={handleGenerate} loading={loading} />
      <GamePreview response={response} loading={loading} error={error} />
    </div>
  );
}
