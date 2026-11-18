export type Choice = 'rock' | 'paper' | 'scissors'
export type Outcome = 'win' | 'lose' | 'draw' // 玩家视角：win为玩家胜，lose为AI胜
export type RoundMode = 'countdown' | 'flow'

export interface RoundRecord {
  id: number
  timestamp: number
  mode: RoundMode
  playerChoice: Choice
  aiChoice: Choice
  predictedPlayerChoice: Choice
  outcome: Outcome
  strategyName: string
  inputProvider: string
  commentary?: string
  confidence?: number
}

export interface InputEvent {
  roomId?: string
  choice: Choice
  confidence: number
  provider: string
  timestamp: number
  raw?: any
}

export interface Strategy {
  name: string
  displayName?: string
  description?: string
  predict(history: RoundRecord[], currentContext?: any): Promise<Choice> | Choice
}

export interface InputAdapter {
  name: string
  displayName?: string
  description?: string
}

export interface RoomStats {
  total: number
  playerWins: number
  aiWins: number
  draws: number
  winRate: number // 玩家胜率 0~1
  aiWinRate: number // AI胜率 0~1
}

export interface RoomConfig {
  id: string
  name: string
  mode: RoundMode
  activeStrategy: string
  activeInputAdapter: string
  countdownSeconds: number // 默认 3
  flowDebounceMs: number // 默认 500ms
}
