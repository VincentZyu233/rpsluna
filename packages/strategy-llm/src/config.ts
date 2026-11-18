import { Schema } from 'koishi'

export interface Config {
  endpoint: string
  apiKey: string
  model: string
  persona: 'toxic' | 'professor' | 'chuuni'
  timeout: number
}

export const Config: Schema<Config> = Schema.object({
  endpoint: Schema.string().default('https://api.openai.com/v1').description('NewAPI 或 OpenAI 兼容端点 Base URL'),
  apiKey: Schema.string().role('secret').default('').description('API 密钥 (Key)'),
  model: Schema.string().default('gpt-4o-mini').description('模型名称 (如 gpt-4o-mini, deepseek-chat 等)'),
  persona: Schema.union([
    Schema.const('toxic').description('毒舌傲娇对手 (嘲讽与心理施压)'),
    Schema.const('professor').description('冷静心理学教授 (学术分析)'),
    Schema.const('chuuni').description('中二宿命博弈家 (命运之线)'),
  ]).default('toxic').description('对手性格设定'),
  timeout: Schema.number().default(3000).description('API 请求超时时间 (毫秒，超时自动降级)'),
})
