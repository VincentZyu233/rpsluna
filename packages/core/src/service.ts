import { Context, Service } from 'koishi'
import { InputAdapter, InputEvent, RoundRecord, Strategy } from './types'
import { RpsRoom } from './room'

declare module 'koishi' {
  interface Context {
    rpsluna: RpsLunaService
  }
}

export class RpsLunaService extends Service {
  public rooms: Map<string, RpsRoom> = new Map()
  public strategies: Map<string, Strategy> = new Map()
  public adapters: Map<string, InputAdapter> = new Map()

  constructor(ctx: Context, public config: any) {
    super(ctx, 'rpsluna', true)

    // 创建默认对战房间
    this.getOrCreateRoom('default', config?.defaultRoomName || 'RPS 赛博博弈竞技场')
  }

  public getOrCreateRoom(id: string, name?: string): RpsRoom {
    let room = this.rooms.get(id)
    if (!room) {
      room = new RpsRoom({
        id,
        name: name || `房间 ${id}`,
        mode: 'countdown',
        activeStrategy: 'random',
        activeInputAdapter: 'buttons',
        countdownSeconds: 3,
        flowDebounceMs: 500,
      })
      this.rooms.set(id, room)
      this.ctx.emit('rpsluna/room-created' as any, room)
    }
    return room
  }

  public registerStrategy(strategy: Strategy): () => void {
    this.strategies.set(strategy.name, strategy)
    this.ctx.logger('rpsluna').info(`已注册博弈策略: [${strategy.name}] ${strategy.displayName || ''}`)
    return () => {
      this.strategies.delete(strategy.name)
    }
  }

  public registerAdapter(adapter: InputAdapter): () => void {
    this.adapters.set(adapter.name, adapter)
    this.ctx.logger('rpsluna').info(`已注册输入适配器: [${adapter.name}] ${adapter.displayName || ''}`)
    return () => {
      this.adapters.delete(adapter.name)
    }
  }

  public getStrategy(name: string): Strategy | undefined {
    return this.strategies.get(name)
  }

  /**
   * 统一分发出拳事件到对应房间
   */
  public async dispatchInput(event: InputEvent): Promise<RoundRecord | null> {
    const roomId = event.roomId || 'default'
    const room = this.getOrCreateRoom(roomId)
    const result = await room.handleInput(event, (name) => this.getStrategy(name))
    if (result) {
      this.ctx.emit('rpsluna/round-settled' as any, { roomId, record: result })
    }
    return result
  }
}
