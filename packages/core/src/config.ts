import { Schema } from 'koishi'

export interface Config {
  defaultRoomName?: string
}

export const Config: Schema<Config> = Schema.object({
  defaultRoomName: Schema.string().default('RPS 赛博博弈竞技场').description('默认对战房间名称'),
})
