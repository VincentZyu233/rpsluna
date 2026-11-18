import { Schema } from 'koishi'

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
