export type GenerationMode = 'new' | 'modify'

export type JobStatus = 'designing' | 'building' | 'testing' | 'ready' | 'failed'

export type PromptMessage = {
  id: number
  prompt: string
}

export type GamePlan = {
  title: string
}

export type NewJobRequest = {
  prompt: string
  mode: GenerationMode
  baseGameId?: string
}

export type JobResponse = {
  job_id: string
  status: JobStatus
  plan?: GamePlan
  game_url?: string
  error?: string
}