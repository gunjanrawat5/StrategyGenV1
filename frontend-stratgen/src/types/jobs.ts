export type JobStatus = 'designing' | 'building' | 'testing' | 'ready' | 'failed'
export type GenerationMode = 'new' | 'modify'

export type GamePlan = {
  title: string
  genre: string
  core_loop: string
  controls: string[]
  mechanics: Array<'dodge' | 'shoot' | 'collect' | 'survive'>
  player: {
    speed: number
    radius: number
    color: string
    health: number
  }
  enemy_archetypes: Array<{
    id: string
    movement: 'fall' | 'zigzag' | 'chase'
    speed: number
    radius: number
    color: string
    count: number
  }>
  player_rules: string[]
  enemy_rules: string[]
  physics_rules: {
    gravity: number
    max_speed: number
    friction: number
  }
  win_condition: string
  lose_condition: string
  ui_text: Record<string, string>
  difficulty: {
    enemy_spawn_interval_ms: number
    enemy_speed: number
    score_per_enemy: number
    target_score: number
  }
  scene_graph_objects: Array<{
    id: string
    kind: 'player' | 'enemy' | 'projectile' | 'pickup' | 'decoration'
  }>
}

export type CreateJobResponse = {
  job_id: string
  status: JobStatus
  mode: GenerationMode
}

export type JobResponse = {
  job_id: string
  status: JobStatus
  mode: GenerationMode
  base_game_id: string | null
  prompt: string
  error: string | null
  game_url: string | null
  plan: GamePlan | null
}

export type PromptMessage = {
  id: number
  prompt: string
}
