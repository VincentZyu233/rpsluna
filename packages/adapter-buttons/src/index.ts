import { Context, Schema } from 'koishi'
import { Choice } from 'koishi-plugin-rpsluna-core'
import { usage } from './usage'

export const name = 'rpsluna-adapter-buttons'
export { usage }

export interface Config {
  autoRegister?: boolean
}

export const Config: Schema<Config> = Schema.object({
  autoRegister: Schema.boolean().default(true).description('是否自动向核心注册输入源。提示：按键出拳 UI 请打开独立的对决大屏 http://localhost:8498'),
})

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
