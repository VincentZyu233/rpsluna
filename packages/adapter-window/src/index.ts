import { Context, Schema } from 'koishi'
import * as Vision from 'koishi-plugin-rpsluna-adapter-vision'

export const name = 'rpsluna-adapter-window'

export interface Config extends Vision.Config {}

export const Config = Vision.Config

export function apply(ctx: Context, config: Config) {
  ctx.logger('rpsluna-window').info('💡 rpsluna-adapter-window 已无缝升级为 rpsluna-adapter-vision，建议在配置文件中更新为 rpsluna-adapter-vision。')
  ctx.plugin(Vision, config)
}
