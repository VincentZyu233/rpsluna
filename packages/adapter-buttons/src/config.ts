import { Schema } from 'koishi'

export interface Config {
  autoRegister?: boolean
}

export const Config: Schema<Config> = Schema.object({
  autoRegister: Schema.boolean().default(true).description('是否自动向核心注册输入源。提示：按键出拳 UI 请打开独立的对决大屏 http://localhost:8498'),
})
