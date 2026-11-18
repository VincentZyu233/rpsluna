import { Context, Schema } from 'koishi'
import { Choice } from 'koishi-plugin-rpsluna-core'
import { WebSocketServer, WebSocket } from 'ws'

export const name = 'rpsluna-adapter-window'

export interface Config {
  port?: number
  wsPath?: string
  httpPath?: string
  defaultRoomId?: string
}

export const Config: Schema<Config> = Schema.object({
  port: Schema.union([Schema.natural(), Schema.transform(Schema.string(), Number)]).default(18082).description('独立监听的视觉数据推流接收端口 (用于接收 Python 伴侣进程)'),
  wsPath: Schema.string().default('/gesture-stream').description('WebSocket 推流接收路径'),
  httpPath: Schema.string().default('/api/gesture').description('HTTP POST 接收路径'),
  defaultRoomId: Schema.string().default('default').description('默认派发到的对战房间 ID'),
})

export function apply(ctx: Context, config: Config) {
  ctx.inject(['rpsluna'], (ctx) => {
    // 1. 注册输入适配器
    ctx.rpsluna.registerAdapter({
      name: 'window',
      displayName: '窗口捕获 (RustDesk/外部视觉)',
      description: '捕获桌面投屏窗口或外接摄像头画面，通过 MediaPipe/OpenCV 识别手势流',
    })

    // 2. 启动轻量专用的 WebSocket / HTTP 网关接收外部推流
    const wss = new WebSocketServer({ port: config.port, path: config.wsPath })

    wss.on('connection', (ws: WebSocket) => {
      ctx.logger('rpsluna').info(`📹 外部视觉伴侣进程 (Python/WebRTC) 已接入推流管道: ws://localhost:${config.port}${config.wsPath}`)

      ws.on('message', async (data: Buffer | string) => {
        try {
          const payload = JSON.parse(data.toString())
          const choice = payload.choice as Choice
          if (!['rock', 'paper', 'scissors'].includes(choice)) return

          const confidence = typeof payload.confidence === 'number' ? payload.confidence : 0.9
          const roomId = payload.roomId || config.defaultRoomId

          // 派发到核心对战状态机
          await ctx.rpsluna.dispatchInput({
            roomId,
            choice,
            confidence,
            provider: 'adapter-window',
            timestamp: Date.now(),
            raw: payload.landmarks,
          })
        } catch (err) {
          // 忽略格式错误帧
        }
      })

      ws.on('close', () => {
        ctx.logger('rpsluna').warn('📹 外部视觉推流连接已断开')
      })
    })

    ctx.on('dispose', () => {
      wss.close()
    })

    ctx.logger('rpsluna').info(`✨ adapter-window 网关已在端口 :${config.port} 监听外部手势推流`)
  })
}
