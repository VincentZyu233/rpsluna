import { Context } from 'koishi'
import { Choice } from 'koishi-plugin-rpsluna-core'
import { Config } from './config'

export * from './config'
export * from './usage'

export const name = 'rpsluna-adapter-buttons'

export function apply(ctx: Context, config: Config) {
  ctx.inject(['rpsluna'], (ctx) => {
    if (config.autoRegister) {
      ctx.rpsluna.registerAdapter({
        name: 'buttons',
        displayName: '纯按键/UI点击',
        description: '通过网页按钮点击、键盘快捷键或模拟器触发的出拳输入',
      })
    }

    // 暴露一个辅助方法供其他前端或测试直接提交出拳
    ctx.on('rpsluna/button-press' as any, (roomId: string, choice: Choice) => {
      return ctx.rpsluna.dispatchInput({
        roomId,
        choice,
        confidence: 1.0,
        provider: 'buttons',
        timestamp: Date.now(),
      })
    })

    ctx.logger('rpsluna').info('✅ adapter-buttons 已就绪')
  })
}
