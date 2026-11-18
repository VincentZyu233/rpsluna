import { Context, Schema } from 'koishi'
import { Choice, RoundRecord } from 'koishi-plugin-rpsluna-core'
import { usage } from './usage'

export const name = 'rpsluna-strategy-markov'
export { usage }

export interface Config {
  order: number
  decayFactor: number
  randomExploreRate: number
}

export const Config: Schema<Config> = Schema.object({
  order: Schema.number().default(2).description('马尔可夫转移阶数 (1 为依赖前1步，2 为依赖前2步)'),
  decayFactor: Schema.percent().default(0.85).description('历史记忆衰减率 (越靠近当前对局权重越高)'),
  randomExploreRate: Schema.percent().default(0.05).description('随机探索率 (偶尔打破规律防止死锁)'),
})

export function apply(ctx: Context, config: Config) {
  ctx.inject(['rpsluna'], (ctx) => {
    ctx.rpsluna.registerStrategy({
      name: 'markov',
      displayName: `${config.order}阶马尔可夫博弈转移模型`,
      description: '基于玩家历史出拳的状态转移概率矩阵预测下一手，带时间衰减权重',
      predict: (history: RoundRecord[]) => {
        const choices: Choice[] = ['rock', 'paper', 'scissors']

        // 随机探索或者历史局数不足时退化为随机
        if (history.length <= config.order || Math.random() < config.randomExploreRate) {
          return choices[Math.floor(Math.random() * choices.length)]
        }

        // 获取当前的前置状态序列（如最近 order 步玩家的出拳）
        const recentHistory = history.slice(-config.order)
        const currentState = recentHistory.map((h) => h.playerChoice).join('-')

        // 统计状态转移频次（带时间衰减权重）
        const scores: Record<Choice, number> = {
          rock: 0,
          paper: 0,
          scissors: 0,
        }

        const totalRounds = history.length
        for (let i = config.order; i < totalRounds; i++) {
          const pastState = history
            .slice(i - config.order, i)
            .map((h) => h.playerChoice)
            .join('-')

          if (pastState === currentState) {
            const nextChoice = history[i].playerChoice
            // 计算时间权重：越近权重越大
            const distance = totalRounds - i
            const weight = Math.pow(config.decayFactor, distance)
            scores[nextChoice] += weight
          }
        }

        // 找出得分最高的出拳（如果全为 0 说明该状态此前未见过，退化为总体频次统计）
        let bestChoice: Choice = 'rock'
        let maxScore = -1

        for (const c of choices) {
          if (scores[c] > maxScore) {
            maxScore = scores[c]
            bestChoice = c
          }
        }

        if (maxScore > 0) {
          return bestChoice
        }

        // 兜底：全局频率分析
        const globalCounts: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 }
        for (const r of history) {
          globalCounts[r.playerChoice]++
        }
        return (Object.keys(globalCounts) as Choice[]).reduce((a, b) =>
          globalCounts[a] >= globalCounts[b] ? a : b
        )
      },
    })

    ctx.logger('rpsluna').info('✅ strategy-markov 已注册')
  })
}
