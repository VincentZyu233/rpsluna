import { Choice, InputEvent, Outcome, RoomConfig, RoomStats, RoundRecord, Strategy } from './types'
import { counterChoice, judge } from './judge'

export type RoomEventCallback = (eventName: string, data: any) => void

export class RpsRoom {
  public id: string
  public name: string
  public mode: 'countdown' | 'flow'
  public activeStrategyName: string
  public activeInputAdapter: string
  public countdownSeconds: number
  public flowDebounceMs: number

  public history: RoundRecord[] = []
  public status: 'idle' | 'counting' | 'locked' | 'settled' = 'idle'
  public countdownRemaining: number = 0

  private nextRoundId: number = 1
  private lastFlowTimestamp: number = 0
  private lastFlowChoice: Choice | null = null
  private eventListeners: Set<RoomEventCallback> = new Set()
  private timer: any = null

  constructor(config: RoomConfig) {
    this.id = config.id
    this.name = config.name
    this.mode = config.mode || 'countdown'
    this.activeStrategyName = config.activeStrategy || 'random'
    this.activeInputAdapter = config.activeInputAdapter || 'buttons'
    this.countdownSeconds = config.countdownSeconds || 3
    this.flowDebounceMs = config.flowDebounceMs || 500
  }

  public onEvent(callback: RoomEventCallback) {
    this.eventListeners.add(callback)
    return () => this.eventListeners.delete(callback)
  }

  private emit(eventName: string, data: any) {
    for (const listener of this.eventListeners) {
      try {
        listener(eventName, data)
      } catch (err) {
        // ignore listener error
      }
    }
  }

  /**
   * 启动回合倒计时（模式 A）
   */
  public startCountdown(onTick?: (sec: number) => void): Promise<void> {
    if (this.status === 'counting') return Promise.resolve()
    this.status = 'counting'
    this.countdownRemaining = this.countdownSeconds
    this.emit('countdown:start', { roomId: this.id, remaining: this.countdownRemaining })

    return new Promise((resolve) => {
      if (this.timer) clearInterval(this.timer)
      this.timer = setInterval(() => {
        this.countdownRemaining -= 1
        this.emit('countdown:tick', { roomId: this.id, remaining: this.countdownRemaining })
        if (onTick) onTick(this.countdownRemaining)

        if (this.countdownRemaining <= 0) {
          clearInterval(this.timer)
          this.timer = null
          this.status = 'locked'
          this.emit('countdown:ready', { roomId: this.id })
          resolve()
        }
      }, 1000)
    })
  }

  /**
   * 处理玩家输入事件并结算该回合
   */
  public async handleInput(
    event: InputEvent,
    getStrategy: (name: string) => Strategy | undefined
  ): Promise<RoundRecord | null> {
    const now = Date.now()

    // 连续流式模式 (模式 B) 防抖过滤
    if (this.mode === 'flow') {
      if (
        this.lastFlowChoice === event.choice &&
        now - this.lastFlowTimestamp < this.flowDebounceMs
      ) {
        return null // 相同手势在防抖间隔内忽略
      }
      this.lastFlowChoice = event.choice
      this.lastFlowTimestamp = now
    }

    // 获取当前策略进行出拳预测
    const strategy = getStrategy(this.activeStrategyName) || {
      name: 'random-fallback',
      predict: () => {
        const choices: Choice[] = ['rock', 'paper', 'scissors']
        return choices[Math.floor(Math.random() * choices.length)]
      },
    }

    // 策略预测玩家会出什么手势
    let predictedPlayerChoice: Choice
    const meta: any = {
      roomId: this.id,
      currentEvent: event,
    }
    try {
      predictedPlayerChoice = await strategy.predict(this.history, meta)
    } catch (err) {
      predictedPlayerChoice = 'rock'
    }

    // AI 出拳：出能克制其预测手势的拳
    const aiChoice = counterChoice(predictedPlayerChoice)
    const playerChoice = event.choice
    const outcome = judge(playerChoice, aiChoice)

    const record: RoundRecord = {
      id: this.nextRoundId++,
      timestamp: now,
      mode: this.mode,
      playerChoice,
      aiChoice,
      predictedPlayerChoice,
      outcome,
      strategyName: strategy.name,
      inputProvider: event.provider,
      confidence: event.confidence,
      commentary: meta.commentary,
    }

    this.history.push(record)
    this.status = 'settled'
    this.emit('round:settled', { roomId: this.id, record })
    return record
  }

  public getStats(): RoomStats {
    let playerWins = 0
    let aiWins = 0
    let draws = 0

    for (const r of this.history) {
      if (r.outcome === 'win') playerWins++
      else if (r.outcome === 'lose') aiWins++
      else draws++
    }

    const total = this.history.length
    return {
      total,
      playerWins,
      aiWins,
      draws,
      winRate: total > 0 ? playerWins / total : 0,
      aiWinRate: total > 0 ? aiWins / total : 0,
    }
  }

  public clearHistory() {
    this.history = []
    this.status = 'idle'
    this.emit('room:reset', { roomId: this.id })
  }
}
