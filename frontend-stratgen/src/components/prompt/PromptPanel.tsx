import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { GenerationMode, PromptMessage } from '../../types/jobs'
import './PromptPanel.css'

type PromptPanelProps = {
  messages: PromptMessage[]
  isSubmitting: boolean
  statusText: string
  error: string | null
  generationMode: GenerationMode
  canModify: boolean
  currentGameId: string | null
  onModeChange: (mode: GenerationMode) => void
  onSubmitPrompt: (prompt: string, mode: GenerationMode) => Promise<void>
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

  const promptCount = useMemo(() => messages.length, [messages])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt || isSubmitting) return

    await onSubmitPrompt(trimmedPrompt, generationMode)
    setPrompt('')
  }

  return (
    <div className="prompt-panel">
      <header className="prompt-panel__header">
        <p className="prompt-panel__eyebrow">GGen Console</p>
        <h1>Game Prompt Studio</h1>
        <p className="prompt-panel__meta">{promptCount} prompt{promptCount === 1 ? '' : 's'} sent</p>
      </header>

      <div className="prompt-panel__log" aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className="prompt-card">
            <span className="prompt-card__label">Prompt</span>
            <p>{message.prompt}</p>
          </article>
        ))}
      </div>

      <form className="prompt-panel__composer" onSubmit={handleSubmit}>
        <fieldset className="prompt-panel__mode">
          <legend>Mode</legend>
          <label>
            <input
              type="radio"
              name="generation-mode"
              value="new"
              checked={generationMode === 'new'}
              onChange={() => onModeChange('new')}
              disabled={isSubmitting}
            />
            New game
          </label>
          <label>
            <input
              type="radio"
              name="generation-mode"
              value="modify"
              checked={generationMode === 'modify'}
              onChange={() => onModeChange('modify')}
              disabled={isSubmitting || !canModify}
            />
            Modify current
          </label>
          <p className="prompt-panel__mode-hint">
            {canModify && currentGameId
              ? `Current game: ${currentGameId}`
              : 'No game selected yet. Generate a new game first.'}
          </p>
        </fieldset>

        <label htmlFor="prompt-input">New prompt</label>
        <textarea
          id="prompt-input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={
            generationMode === 'modify'
              ? 'Describe how to modify the current game...'
              : 'Describe the next game to generate...'
          }
          rows={5}
          disabled={isSubmitting}
        />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Generating...' : generationMode === 'modify' ? 'Apply Changes' : 'Create Game'}
        </button>
      </form>

      <p className="prompt-panel__status" role="status">{statusText}</p>
      {error ? <p className="prompt-panel__error">{error}</p> : null}
    </div>
  )
}

export default PromptPanel
