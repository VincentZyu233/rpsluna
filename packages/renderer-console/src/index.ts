import { Context, Schema } from 'koishi'
import {} from '@koishijs/plugin-console'
import { resolve } from 'path'

export const name = 'rpsluna-renderer-console'

export const inject = {
  required: ['rpsluna'],
  optional: ['console'],
}

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

export function apply(ctx: Context, config: Config) {
  // 必须严格监听 console 服务就绪，确保无论加载先后顺序，addEntry 一定生效！
  ctx.inject(['console'], (ctx) => {
    const entryDir = resolve(ctx.baseDir, 'node_modules/koishi-plugin-rpsluna-renderer-console')
    ctx.console.addEntry(process.env.KOISHI_BASE ? [
      process.env.KOISHI_BASE + '/dist/index.js',
      process.env.KOISHI_BASE + '/dist/style.css',
    ] : {
      dev: resolve(entryDir, 'client/index.ts'),
      prod: resolve(entryDir, 'dist'),
    })

    // 注册 Console API 供前端扩展页面与卡片调用
    const consoleApi = ctx.console

    // 1. 获取所有房间列表及战况
    consoleApi.addListener('rpsluna/get-rooms', async () => {
      const rooms: any[] = []
      if (ctx.rpsluna?.rooms) {
        for (const [id, room] of ctx.rpsluna.rooms.entries()) {
          rooms.push({
            id,
            name: room.name,
            state: room.state,
            rhythmMode: room.rhythmMode,
            strategy: room.strategyName,
            stats: room.getStats(),
            history: room.history.slice(-15),
          })
        }
      }
      return { rooms, portalUrl: config.portalUrl }
    })

    // 2. 更新房间设置 (切换策略/节奏/重置比分)
    consoleApi.addListener('rpsluna/update-room', async ({ roomId, action, value }: any) => {
      const room = ctx.rpsluna?.rooms?.get(roomId)
      if (!room) return { success: false, error: '房间不存在' }

      if (action === 'set-strategy') {
        room.strategyName = value
        return { success: true, strategy: value }
      }
      if (action === 'set-rhythm') {
        room.rhythmMode = value
        return { success: true, rhythmMode: value }
      }
      if (action === 'reset-stats') {
        room.history = []
        return { success: true }
      }
      return { success: false, error: '未知操作' }
    })

    // 3. 获取所有已注册的 AI 策略
    consoleApi.addListener('rpsluna/get-strategies', async () => {
      const strategies: any[] = []
      if (ctx.rpsluna?.strategies) {
        for (const [name, strategy] of ctx.rpsluna.strategies.entries()) {
          strategies.push({
            name,
            displayName: strategy.displayName || name,
            description: strategy.description || '',
          })
        }
      }
      return strategies
    })

    // 4. 模拟出拳测试
    consoleApi.addListener('rpsluna/simulate-round', async ({ roomId, choice }: any) => {
      const room = ctx.rpsluna?.rooms?.get(roomId || 'lobby')
      if (!room) return { success: false, error: '房间不存在' }
      const record = await room.recordPlayerMove('console-admin', choice, 'console')
      return { success: true, record, stats: room.getStats() }
    })

    // 5. 获取视觉伴侣状态 (轻量 ping 与状态探测)
    consoleApi.addListener('rpsluna/get-vision-status', async () => {
      let isOnline = false
      let isKioskOnline = false
      const baseUrl = config.visionStreamUrl || 'http://127.0.0.1:9498'
      try {
        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/vision/status`, { signal: AbortSignal.timeout(1500) })
        if (res.ok) {
          const data: any = await res.json()
          isKioskOnline = true
          isOnline = !!data.isOnline
        } else {
          isOnline = res.status === 200 || res.status === 404
        }
      } catch {
        // 兜底尝试 HEAD
        try {
          const res = await fetch(baseUrl, { method: 'HEAD', signal: AbortSignal.timeout(1000) })
          isOnline = res.ok || res.status === 200
        } catch {
          isOnline = false
        }
      }
      return {
        isOnline,
        isKioskOnline,
        streamUrl: baseUrl,
      }
    })
  })

  ctx.inject(['rpsluna'], (ctx) => {
    // 监听对局结算事件并在日志/控制台广播
    ctx.on('rpsluna/round-settled' as any, ({ roomId, record }: any) => {
      const room = ctx.rpsluna.rooms.get(roomId)
      const roomName = room ? room.name : roomId
      ctx.logger('rpsluna').info(
        `🏆【${roomName}】第 #${record.id} 回合: 玩家(${record.playerChoice}) vs AI(${record.aiChoice}) => 战果: ${record.outcome.toUpperCase()}`
      )

      // 实时广播到控制台前端 WebSocket
      if (config.broadcastEvents && (ctx as any).console?.broadcast) {
        ;(ctx as any).console.broadcast('rpsluna/event-round-settled', {
          roomId,
          record,
          stats: room ? room.getStats() : null,
        })
      }
    })

    ctx.logger('rpsluna').info('✅ renderer-console 控制台可视化监控已全量挂载')
  })
}
