import { Schema } from 'koishi'

export interface Config {
  port: number
  host: string
  defaultRoomId: string
  defaultDifficulty: 'adaptive' | 'easy' | 'normal' | 'hard' | 'cheat'
  enableDifficultySelector: boolean
  kioskSkin: 'cyber' | 'atrium' | 'kids'
}

export const Config: Schema<Config> = Schema.object({
  port: Schema.union([
    Schema.natural().max(65535),
    Schema.transform(Schema.string(), (v) => {
      const n = parseInt(v, 10)
      if (isNaN(n) || n < 0 || n > 65535) throw new Error('端口必须是 0-65535 之间的整数')
      return n
    }),
  ]).default(9498).description('视觉体感大屏与推流网关端口 (默认 9498)'),
  host: Schema.string().default('0.0.0.0').description('监听的主机地址 (0.0.0.0 允许全域网访问)'),
  defaultRoomId: Schema.string().default('default').description('默认交互对决房间 ID'),
  defaultDifficulty: Schema.union([
    Schema.const('adaptive').description('🧠 智能自适应大脑模式 (需前置 markov 与 all 插件)'),
    Schema.const('easy').description('🌱 轻松娱乐模式 (高概率放水)'),
    Schema.const('normal').description('⚖️ 经典平衡模式 (真随机博弈)'),
    Schema.const('hard').description('🔥 绝对读心模式 (全开压制)'),
    Schema.const('cheat').description('⚡ 最后一帧降维外挂模式 (测试专用)'),
  ]).default('adaptive').description('默认启动博弈对决算法模式'),
  enableDifficultySelector: Schema.boolean().default(true).description('是否在外部交互大屏显示难度调整控件'),
  kioskSkin: Schema.union([
    Schema.const('cyber').description('高校与电竞·赛博霓虹机能风'),
    Schema.const('atrium').description('商场快闪中庭·高明度极简明朗风'),
    Schema.const('kids').description('低幼与展厅·超大字号童趣像素风'),
  ]).default('cyber').description('大屏默认交互视觉皮肤'),
}).description('基础交互与端口设置')
