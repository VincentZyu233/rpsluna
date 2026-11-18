import { Schema } from 'koishi'

export interface Config {
  port: number
  host: string
  title: string
}

export const Config: Schema<Config> = Schema.object({
  port: Schema.union([
    Schema.natural().max(65535),
    Schema.transform(Schema.string(), (v) => {
      const n = parseInt(v, 10)
      if (isNaN(n) || n < 0 || n > 65535) throw new Error('端口必须是 0-65535 之间的整数')
      return n
    }),
  ]).default(8498).description('公网玩家独立访问端口 (用于 FRP 穿透，与 Koishi 控制台物理隔离)'),
  host: Schema.string().default('0.0.0.0').description('监听的主机地址 (0.0.0.0 表示允许所有外网 IP 访问)'),
  title: Schema.string().default('rpsluna 竞技场').description('网页标题'),
})
