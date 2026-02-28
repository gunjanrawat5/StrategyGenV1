import type { JobResponse, NewJobRequest } from '../types/jobs'

const DEFAULT_API_BASE = 'http://127.0.0.1:8000'

export function getApiBase(): string {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || DEFAULT_API_BASE
}

export async function createJob(payload: NewJobRequest): Promise<JobResponse> {
  const response = await fetch(`${getApiBase()}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: payload.prompt,
      mode: payload.mode,
      base_game_id: payload.mode === 'modify' ? payload.baseGameId : undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create job (${response.status})`)
  }

  return (await response.json()) as JobResponse
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(`${getApiBase()}/jobs/${jobId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch job ${jobId} (${response.status})`)
  }

  return (await response.json()) as JobResponse
}
