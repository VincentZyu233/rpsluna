import { Context, Schema, h, Session } from 'koishi'
import { Choice, formatChoice, formatOutcome, RoundRecord } from 'koishi-plugin-rpsluna-core'

export const name = 'rpsluna-adapter-satori-command'

export const inject = ['rpsluna']

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

export function apply(ctx: Context, config: Config) {
  // 1. 向核心状态机注册输入适配器驱动
  ctx.rpsluna.registerAdapter({
    name: 'satori-command',
    displayName: '聊天平台指令与交互组件 (Satori)',
    description: '通过聊天文字指令 (/rps) 或平台原生交互按钮 (QQ/Telegram/Discord) 驱动出拳',
  })

  const cmdName = config.commandName || 'rps'

  // 辅助函数：构建带有 Satori 原生按钮的消息片段
  function createButtonPanel(headerText: string, extraElements: any[] = []) {
    if (!config.enableButtons) {
      return headerText
    }

    return h('message', [
      h('p', headerText),
      ...extraElements,
      h('button-group', [
        h('button', { id: 'rps:action:rock' }, '✊ 石头'),
        h('button', { id: 'rps:action:scissors' }, '✌️ 剪刀'),
        h('button', { id: 'rps:action:paper' }, '🖐️ 布'),
      ]),
      h('button-group', [
        h('button', { id: 'rps:query:stats' }, '📊 战绩'),
        h('button', { id: 'rps:query:strategy' }, '🧠 策略大脑'),
        h('button', { id: 'rps:query:rooms' }, '🏠 房间列表'),
      ]),
    ])
  }

  // 辅助函数：格式化单局结算报告
  function formatSettleMessage(roomName: string, record: RoundRecord): string {
    const lines = [
      `🎮【${roomName}】第 #${record.id} 回合结算：`,
      `你出了：${formatChoice(record.playerChoice)}`,
      `AI 出了：${formatChoice(record.aiChoice)}（预判你会出: ${formatChoice(record.predictedPlayerChoice)}）`,
      `战果：${formatOutcome(record.outcome)}`,
    ]
    if (record.commentary) {
      lines.push(`💬 评委点评: ${record.commentary}`)
    }
    return lines.join('\n')
  }

  // 辅助函数：格式化战绩报告
  function formatStatsMessage(room: any): string {
    const stats = room.getStats()
    return [
      `📊【${room.name}】对局战绩统计：`,
      `总局数: ${stats.total}`,
      `玩家胜: ${stats.playerWins} | AI胜: ${stats.aiWins} | 平局: ${stats.draws}`,
      `玩家胜率: ${(stats.winRate * 100).toFixed(1)}% | AI胜率: ${(stats.aiWinRate * 100).toFixed(1)}%`,
      `当前策略: [${room.activeStrategyName}] | 当前模式: ${room.mode}`,
    ].join('\n')
  }

  // 2. 注册统一聊天指令 /rps
  ctx.command(`${cmdName} [choice]`, '石头剪刀布人机博弈对决 (支持文字出拳与原生按钮)')
    .option('room', '-r [room:string] 指定对战房间号或查询房间列表')
    .option('stats', '-s 查看当前战绩')
    .option('strategy', '-m [strategy:string] 切换博弈策略或查询策略列表')
    .action(async ({ session, options }, choiceInput) => {
      if (!session) return

      // 检查是否有 -r 选项
      const hasRoomOption = 'room' in (options || {})
      const roomVal = typeof options?.room === 'string' ? options.room.trim() : ''

      // A. 若输入 -r 且未传具体参数，列出所有房间
      if (hasRoomOption && !roomVal) {
        const rooms = Array.from(ctx.rpsluna.rooms.values())
        return [
          '🏠 当前已开放对战房间列表：',
          ...rooms.map(r => `• [${r.id}] ${r.name} (策略: ${r.activeStrategyName}, 对局数: ${r.history.length})`),
          '',
          `👉 提示：使用 /${cmdName} [石头/剪刀/布] -r <房间号> 即可进入指定房间`,
        ].join('\n')
      }

      // 获取当前房间：若未指定则绑定群/频道/私聊 ID 或 default
      const roomId = roomVal || session.channelId || session.userId || 'default'
      const roomName = session.event?.channel?.name || session.event?.guild?.name || (roomId === 'default' ? '默认大厅' : `房间 ${roomId}`)
      const room = ctx.rpsluna.getOrCreateRoom(roomId, roomName)

      // 检查是否有 -m 选项
      const hasStrategyOption = 'strategy' in (options || {})
      const strategyVal = typeof options?.strategy === 'string' ? options.strategy.trim() : ''

      // B. 若输入 -m 且未传具体参数，列出所有策略
      if (hasStrategyOption && !strategyVal) {
        const strategies = Array.from(ctx.rpsluna.strategies.values())
        return [
          `🧠 当前可用博弈决策大脑列表 (当前房间【${room.name}】正在使用: ${room.activeStrategyName})：`,
          ...strategies.map(s => `• [${s.name}] ${s.displayName || s.name}${s.description ? ' - ' + s.description : ''}`),
          '',
          `👉 提示：使用 /${cmdName} -m <策略名> 即可切换 (例如: /${cmdName} -m markov)`,
        ].join('\n')
      }

      // C. 切换策略 (传入了具体策略名)
      if (strategyVal) {
        if (!ctx.rpsluna.strategies.has(strategyVal)) {
          const available = Array.from(ctx.rpsluna.strategies.keys()).join(', ')
          return `❌ 找不到策略 [${strategyVal}]。当前可用策略: ${available}`
        }
        room.activeStrategyName = strategyVal
        return `✅ 已将房间【${room.name}】博弈策略切换为: [${strategyVal}]`
      }

      // D. 查看战绩 (-s)
      if (options?.stats) {
        return createButtonPanel(formatStatsMessage(room))
      }

      // E. 解析出拳
      let choice: Choice | null = null
      if (choiceInput) {
        const normalized = choiceInput.trim().toLowerCase()
        if (['rock', '石头', '拳', '0'].includes(normalized)) choice = 'rock'
        else if (['paper', '布', '包', '5'].includes(normalized)) choice = 'paper'
        else if (['scissors', '剪刀', '剪', '2'].includes(normalized)) choice = 'scissors'
      }

      // 若未出拳，下发按钮操作面板或文字指引
      if (!choice) {
        const guideText = [
          `🎮【${room.name}】石头剪刀布人机博弈对决！`,
          `请选择你的出拳，点击下方按钮或直接回复文字：`,
          `👉 文字指令：/${cmdName} 石头 | /${cmdName} 剪刀 | /${cmdName} 布`,
          `👉 选项：-s 战绩 | -m 策略 | -r 房间`,
        ].join('\n')

        return createButtonPanel(guideText)
      }

      // F. 执行出拳结算
      const record = await ctx.rpsluna.dispatchInput({
        roomId: room.id,
        choice,
        confidence: 1.0,
        provider: `command:${session.platform || 'im'}`,
        timestamp: Date.now(),
      })

      if (!record) return '出拳已被忽略或对局异常。'

      const settleText = formatSettleMessage(room.name, record)
      return config.enableAutoNextRound ? createButtonPanel(settleText) : settleText
    })

  // 3. 监听 Satori 标准原生交互按钮事件 (QQ / Telegram / Discord 等通用)
  ctx.on('interaction/button', async (session: Session) => {
    const buttonId = (session.event as any)?.button?.id
    if (!buttonId || typeof buttonId !== 'string' || !buttonId.startsWith('rps:')) return

    const parts = buttonId.split(':')
    const actionCategory = parts[1]
    const actionValue = parts[2]

    // 获取当前触发交互的用户房间
    const roomId = session.channelId || session.userId || 'default'
    const roomName = session.event?.channel?.name || session.event?.guild?.name || (roomId === 'default' ? '默认大厅' : `房间 ${roomId}`)
    const room = ctx.rpsluna.getOrCreateRoom(roomId, roomName)

    // A. 玩家直接点击了出拳按钮 (rps:action:rock / scissors / paper)
    if (actionCategory === 'action') {
      const choice = actionValue as Choice
      if (!['rock', 'paper', 'scissors'].includes(choice)) return

      const record = await ctx.rpsluna.dispatchInput({
        roomId: room.id,
        choice,
        confidence: 1.0,
        provider: `button:${session.platform || 'satori'}`,
        timestamp: Date.now(),
      })

      if (!record) return

      const settleText = formatSettleMessage(room.name, record)
      await session.send(config.enableAutoNextRound ? createButtonPanel(settleText) : settleText)
      return
    }

    // B. 玩家点击了辅助查询按钮
    if (actionCategory === 'query') {
      if (actionValue === 'stats') {
        await session.send(createButtonPanel(formatStatsMessage(room)))
        return
      }

      if (actionValue === 'strategy') {
        const strategies = Array.from(ctx.rpsluna.strategies.values())
        const text = [
          `🧠 当前可用博弈决策大脑列表 (当前房间【${room.name}】使用: ${room.activeStrategyName})：`,
          ...strategies.map(s => `• [${s.name}] ${s.displayName || s.name}`),
          '',
          `👉 发送 /${cmdName} -m <策略名> 即可切换大脑`,
        ].join('\n')
        await session.send(createButtonPanel(text))
        return
      }

      if (actionValue === 'rooms') {
        const rooms = Array.from(ctx.rpsluna.rooms.values())
        const text = [
          '🏠 当前已开放对战房间列表：',
          ...rooms.map(r => `• [${r.id}] ${r.name} (策略: ${r.activeStrategyName})`),
          '',
          `👉 发送 /${cmdName} -r <房间号> 切换房间`,
        ].join('\n')
        await session.send(createButtonPanel(text))
        return
      }
    }
  })

  ctx.logger('rpsluna').info(`✨ adapter-satori-command 已就绪 (主指令: /${cmdName}, 按钮交互: ${config.enableButtons ? '已启用' : '已停用'})`)
}
