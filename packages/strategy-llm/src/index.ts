import { Context, Schema } from 'koishi'
import { Choice, RoundRecord } from 'koishi-plugin-rpsluna-core'
import { request } from 'undici'

export const name = 'rpsluna-strategy-llm'

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

export function apply(ctx: Context, config: Config) {
  ctx.inject(['rpsluna'], (ctx) => {
    ctx.rpsluna.registerStrategy({
      name: 'llm',
      displayName: 'LLM 心理战读心大师',
      description: '接入大模型，深度分析人类博弈心理模式，输出预判与嘲讽台词',
      predict: async (history: RoundRecord[], meta?: any) => {
        const choices: Choice[] = ['rock', 'paper', 'scissors']

        // 若未配置 API Key 或历史少于 2 局，优雅使用启发式
        if (!config.apiKey || history.length < 2) {
          const fallback = choices[Math.floor(Math.random() * choices.length)]
          if (meta?.currentEvent) {
            meta.commentary = config.apiKey ? '（数据收集观察中...）' : '（当前处于离线模式，配置 NewAPI 即可唤醒毒舌心智）'
          }
          return fallback
        }

        const recent = history.slice(-8).map((r, idx) => ({
          round: idx + 1,
          player: r.playerChoice,
          ai: r.aiChoice,
          outcome: r.outcome,
        }))

        const prompt = `你是一个石头剪刀布心理学对战 AI，性格设定为: ${config.persona}。
以下是玩家最近几局的出手记录：
${JSON.stringify(recent)}

请基于人类心理学（如输留赢变习惯、避免连续同出等），预测玩家下一局最可能出什么。
必须严格只输出 JSON 格式，不要包含任何 markdown 标记：
{"prediction": "rock" | "paper" | "scissors", "commentary": "简短的一句话心理嘲讽或点评(15字内)"}`

        try {
          const url = config.endpoint.replace(/\/+$/, '') + '/chat/completions'
          const res = await request(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: prompt }],
              temperature: 0.7,
              response_format: { type: 'json_object' },
            }),
            headersTimeout: config.timeout,
            bodyTimeout: config.timeout,
          })

          if (res.statusCode >= 200 && res.statusCode < 300) {
            const data: any = await res.body.json()
            const text = data?.choices?.[0]?.message?.content || '{}'
            const parsed = JSON.parse(text)
            if (['rock', 'paper', 'scissors'].includes(parsed.prediction)) {
              if (meta?.currentEvent) {
                meta.commentary = parsed.commentary || '我看穿了你的心思。'
              }
              return parsed.prediction as Choice
            }
          }
        } catch (err: any) {
          ctx.logger('rpsluna').warn(`LLM 预测调用失败或超时: ${err.message}`)
        }

        // 降级：反向推导上一手
        const last = history[history.length - 1]
        return last ? last.playerChoice : 'rock'
      },
    })

    ctx.logger('rpsluna').info('✅ strategy-llm 已就绪')
  })
}
