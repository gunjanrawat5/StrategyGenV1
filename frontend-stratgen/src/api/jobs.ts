import type { CreateJobResponse, GenerationMode, JobResponse } from '../types/jobs'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000'

export function getApiBase() {
  return API_BASE
}

type CreateJobPayload = {
  prompt: string
  mode: GenerationMode
  baseGameId?: string
}

export async function createJob({ prompt, mode, baseGameId }: CreateJobPayload): Promise<CreateJobResponse> {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      mode,
      base_game_id: baseGameId ?? null,
    }),
  })

  if (!response.ok) {
    let detail = ''
    try {
      const payload = (await response.json()) as { detail?: unknown }
      if (typeof payload.detail === 'string') detail = payload.detail
      if (Array.isArray(payload.detail)) detail = payload.detail.map((item) => JSON.stringify(item)).join(', ')
    } catch {
      detail = ''
    }
    throw new Error(detail ? `Failed to create job (${response.status}): ${detail}` : `Failed to create job (${response.status})`)
  }

  return (await response.json()) as CreateJobResponse
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch job ${jobId} (${response.status})`)
  }

  return (await response.json()) as JobResponse
}
