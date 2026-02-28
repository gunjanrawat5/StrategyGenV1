import { useCallback, useEffect, useMemo, useState } from 'react'
import WorkspaceLayout from './layout/WorkspaceLayout'
import PromptPanel from './components/prompt/PromptPanel'
import GamePreview from './components/game/GamePreview'
import { createJob, getApiBase, getJob } from './api/jobs'
import type { GenerationMode, JobStatus, PromptMessage } from './types/jobs'
import './App.css'

type UiStatus = JobStatus | 'idle'

function App() {
  const [messages, setMessages] = useState<PromptMessage[]>([
    { id: 1, prompt: 'Create a top-down survival game with neon enemies.' },
    { id: 2, prompt: 'Add wave progression and a combo score multiplier.' },
  ])
  const [jobId, setJobId] = useState<string | null>(null)
  const [status, setStatus] = useState<UiStatus>('idle')
  const [statusText, setStatusText] = useState('Ready to generate.')
  const [error, setError] = useState<string | null>(null)
  const [gameTitle, setGameTitle] = useState('Generated Game')
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [generationMode, setGenerationMode] = useState<GenerationMode>('new')

  const isSubmitting = status === 'designing' || status === 'building' || status === 'testing'

  const handleSubmitPrompt = useCallback(async (prompt: string, mode: GenerationMode) => {
    const trimmedPrompt = prompt.trim()
    if (!trimmedPrompt) return
    if (mode === 'modify' && !currentGameId) {
      setError('No current game to modify. Generate a new game first.')
      setStatusText('Cannot modify yet.')
      return
    }

    setMessages((current) => [...current, { id: Date.now(), prompt: trimmedPrompt }])
    setError(null)
    setStatus('designing')
    setStatusText('Designing game plan...')
    if (mode === 'new') {
      setIframeSrc(null)
      setCurrentGameId(null)
    }

    try {
      const created = await createJob({
        prompt: trimmedPrompt,
        mode,
        baseGameId: mode === 'modify' ? currentGameId ?? undefined : undefined,
      })
      setJobId(created.job_id)
      setStatus(created.status)
      setStatusText(mode === 'modify' ? 'Designing updated game plan...' : 'Designing game plan...')
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Failed to start job.'
      setError(message)
      setStatus('failed')
      setStatusText('Failed to start generation.')
    }
  }, [currentGameId])

  useEffect(() => {
    if (!jobId) return

    let cancelled = false
    const pollJob = async () => {
      try {
        const job = await getJob(jobId)
        if (cancelled) return

        setStatus(job.status)
        if (job.status === 'designing') setStatusText('Designing game plan...')
        if (job.status === 'building') setStatusText('Building game code...')
        if (job.status === 'testing') setStatusText('Running checks...')

        if (job.status === 'ready' && job.game_url) {
          setStatusText('Playable build is ready.')
          setGameTitle(job.plan?.title ?? 'Generated Game')
          setIframeSrc(`${getApiBase()}${job.game_url}`)
          setCurrentGameId(job.job_id)
          window.clearInterval(intervalId)
        }

        if (job.status === 'failed') {
          setStatusText('Generation failed.')
          setError(job.error ?? 'Job failed during build pipeline.')
          window.clearInterval(intervalId)
        }
      } catch (pollingError) {
        if (cancelled) return
        const message = pollingError instanceof Error ? pollingError.message : 'Polling failed.'
        setStatus('failed')
        setStatusText('Generation failed.')
        setError(message)
        window.clearInterval(intervalId)
      }
    }

    const intervalId = window.setInterval(pollJob, 1200)
    void pollJob()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [jobId])

  const previewHint = useMemo(() => {
    if (error) return error
    if (status === 'idle') return 'Submit a prompt to generate and load a playable game.'
    return statusText
  }, [error, status, statusText])

  return (
    <WorkspaceLayout
      sidebar={
        <PromptPanel
          messages={messages}
          isSubmitting={isSubmitting}
          statusText={statusText}
          error={error}
          generationMode={generationMode}
          canModify={Boolean(currentGameId)}
          currentGameId={currentGameId}
          onModeChange={setGenerationMode}
          onSubmitPrompt={handleSubmitPrompt}
        />
      }
      content={<GamePreview iframeSrc={iframeSrc} title={gameTitle} status={status} hint={previewHint} />}
    />
  )
}

export default App
