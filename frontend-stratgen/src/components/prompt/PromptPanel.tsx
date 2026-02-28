import './PromptPanel.css'
import { useState } from 'react'
import type { GenerationMode, PromptMessage } from '../../types/jobs'

type PromptPanelProps = {
  messages: PromptMessage[]
  isSubmitting: boolean
  statusText: string
  error: string | null
  generationMode: GenerationMode
  canModify: boolean
  currentGameId: string | null
  onModeChange: (mode: GenerationMode) => void
  onSubmitPrompt: (prompt: string, mode: GenerationMode) => void
}

function PromptPanel({
  messages,
  isSubmitting,
  statusText,
  error,
  generationMode,
  canModify,
  currentGameId,
  onModeChange,
  onSubmitPrompt,
}: PromptPanelProps) {
  const [prompt, setPrompt] = useState('')

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmitPrompt(prompt, generationMode)
    setPrompt('')
  }

  return (
    <section className="prompt-panel">
      <header className="prompt-panel__header">
        <h2>Prompt</h2>
        <p>{statusText}</p>
      </header>

      <div className="prompt-panel__mode">
        <button
          type="button"
          className={generationMode === 'new' ? 'active' : ''}
          onClick={() => onModeChange('new')}
        >
          New
        </button>
        <button
          type="button"
          className={generationMode === 'modify' ? 'active' : ''}
          disabled={!canModify}
          onClick={() => onModeChange('modify')}
        >
          Modify
        </button>
      </div>

      {currentGameId ? <p className="prompt-panel__sub">Current game id: {currentGameId}</p> : null}

      <form onSubmit={submit} className="prompt-panel__form">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={5}
          placeholder="Describe the game to generate..."
        />
        <button type="submit" disabled={isSubmitting || !prompt.trim()}>
          {isSubmitting ? 'Generating...' : 'Generate'}
        </button>
      </form>

      {error ? <p className="prompt-panel__error">{error}</p> : null}

      <ul className="prompt-panel__history">
        {messages.map((message) => (
          <li key={message.id}>{message.prompt}</li>
        ))}
      </ul>
    </section>
  )
}

export default PromptPanel