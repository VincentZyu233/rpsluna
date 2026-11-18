import { Context } from 'koishi'
import { Choice, counterChoice, losingChoice, RoundRecord } from 'koishi-plugin-rpsluna-core'
import { Config } from './config'

export * from './config'
export * from './usage'

export const name = 'rpsluna-strategy-all'

export function apply(ctx: Context, config: Config) {
  ctx.inject(['rpsluna'], (ctx) => {
    // 1. Iocaine Powder 策略
    if (config.enableIocaine) {
      ctx.rpsluna.registerStrategy({
        name: 'iocaine',
        displayName: 'Iocaine Powder 博弈大师',
        description: '1999年国际石头剪刀布编程大赛冠军算法，多重历史序列匹配与元推理仲裁',
        predict: (history: RoundRecord[]) => {
          const choices: Choice[] = ['rock', 'paper', 'scissors']
          if (history.length < 4) {
            return choices[Math.floor(Math.random() * choices.length)]
          }

          // 基础子策略 1: 频率分析 (Naive Frequency)
          const freq: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 }
          for (const r of history) freq[r.playerChoice]++
          const pFreq = (Object.keys(freq) as Choice[]).reduce((a, b) =>
            freq[a] >= freq[b] ? a : b
          )

          // 基础子策略 2: 最长历史序列匹配 (History Matching)
          let pHistoryMatch: Choice = pFreq
          for (let len = Math.min(5, history.length - 1); len >= 1; len--) {
            const pattern = history.slice(-len).map((h) => h.playerChoice).join('')
            let matchedNext: Choice | null = null
            for (let i = 0; i < history.length - len; i++) {
              const sub = history.slice(i, i + len).map((h) => h.playerChoice).join('')
              if (sub === pattern) {
                matchedNext = history[i + len].playerChoice
              }
            }
            if (matchedNext) {
              pHistoryMatch = matchedNext
              break
            }
          }

          // 基础子策略 3: Win-Stay Lose-Shift 模式 (赢留输变心理学)
          const lastRound = history[history.length - 1]
          let pWinStay: Choice = pFreq
          if (lastRound.outcome === 'win') {
            pWinStay = lastRound.playerChoice // 赢了倾向保持
          } else if (lastRound.outcome === 'lose') {
            pWinStay = counterChoice(lastRound.aiChoice) // 输了倾向转向克制AI上一手的拳
          }

          // 6 个候选假设：各子策略的原假设(Level 0) 与 进阶心理博弈(Level 1)
          const hypotheses: Choice[] = [
            pFreq,
            counterChoice(pFreq),
            pHistoryMatch,
            counterChoice(pHistoryMatch),
            pWinStay,
            counterChoice(pWinStay),
          ]

          // 评估这 6 个假设在最近 6 局历史中的表现得分
          let bestHypothesis = hypotheses[2]
          let bestScore = -999

          for (const hyp of hypotheses) {
            let score = 0
            for (let k = Math.max(0, history.length - 6); k < history.length; k++) {
              const pastActual = history[k].playerChoice
              if (hyp === pastActual) score += 2
              else if (counterChoice(hyp) === pastActual) score -= 1
            }
            if (score > bestScore) {
              bestScore = score
              bestHypothesis = hyp
            }
          }

          return bestHypothesis
        },
      })
    }

    // 2. 作弊彩蛋策略
    if (config.enableCheat) {
      ctx.rpsluna.registerStrategy({
        name: 'cheat',
        displayName: '瞬时读心外挂 (Visual Cheat)',
        description: '通过毫秒级帧差偷看玩家正在输入的手势并强行克制（娱乐彩蛋模式）',
        predict: (_history: RoundRecord[], meta?: any) => {
          if (meta?.currentEvent?.choice) {
            // 直接读取玩家当前的真实输入，预测为该输入，外层核心会自动克制它！
            return meta.currentEvent.choice as Choice
          }
          const choices: Choice[] = ['rock', 'paper', 'scissors']
          return choices[Math.floor(Math.random() * choices.length)]
        },
      })
    }

    ctx.logger('rpsluna').info('✅ strategy-all 经典策略全家桶已注册')
  })
}
