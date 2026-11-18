import { Context, Schema } from 'koishi'
import { RpsLunaService } from './service'
import { formatChoice, formatOutcome } from './judge'
import { Choice } from './types'

export * from './types'
export * from './judge'
export * from './room'
export * from './service'
export * from './usage'

export const name = 'rpsluna-core'

export const inject = {
  optional: ['rpsluna'],
}

export interface Config {
  defaultRoomName?: string
}

export const Config: Schema<Config> = Schema.object({
  defaultRoomName: Schema.string().default('RPS 赛博博弈竞技场').description('默认对战房间名称'),
})

export function apply(ctx: Context, config: Config) {
  // 注入核心服务
  const service = new RpsLunaService(ctx, config)
  ctx.set('rpsluna', service)

  // 注册默认真随机兜底策略
  service.registerStrategy({
    name: 'random',
    displayName: '均匀真随机 (Baseline)',
    description: '严格 33.3% 均匀分布出拳基准线',
    predict: () => {
      const choices: Choice[] = ['rock', 'paper', 'scissors']
      return choices[Math.floor(Math.random() * choices.length)]
    },
  })

  ctx.logger('rpsluna').info('✨ rpsluna-core 服务已启动就绪！')
}
