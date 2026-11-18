import { Schema } from 'koishi'

export interface Config {
  commandName?: string
  enableButtons?: boolean
  enableAutoNextRound?: boolean
}

export const Config: Schema<Config> = Schema.object({
  commandName: Schema.string().default('rps').description('聊天平台触发对决的主指令名称'),
  enableButtons: Schema.boolean().default(true).description('是否在支持的聊天平台 (QQ/TG/Discord等) 下发 Satori 原生交互按钮'),
  enableAutoNextRound: Schema.boolean().default(true).description('对局结算后是否在消息底部自动附带下一轮出拳按钮'),
})
