import { Schema } from 'koishi'

export interface Config {
  enableIocaine?: boolean
  enableCheat?: boolean
}

export const Config: Schema<Config> = Schema.object({
  enableIocaine: Schema.boolean().default(true).description('是否启用 Iocaine Powder 传奇博弈策略'),
  enableCheat: Schema.boolean().default(true).description('是否启用 毫秒视觉偷看作弊彩蛋模式'),
})
