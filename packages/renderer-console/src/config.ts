import { Schema } from 'koishi'

export interface Config {
  broadcastEvents?: boolean
  visionStreamUrl?: string
  portalUrl?: string
}

export const Config: Schema<Config> = Schema.object({
  broadcastEvents: Schema.boolean().default(true).description('是否向控制台 WebSocket 客户端实时广播对决事件'),
  visionStreamUrl: Schema.string().default('http://127.0.0.1:9498').description('视觉体感大屏与推流网关地址 (Port 9498)'),
  portalUrl: Schema.string().default('http://localhost:8498').description('对战大屏地址'),
})
