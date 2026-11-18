import { Context, icons } from '@koishijs/client'
import RoomsPage from './pages/rooms.vue'
import StrategyPage from './pages/strategy.vue'
import VisionPage from './pages/vision.vue'
import AnalyticsPage from './pages/analytics.vue'
import HomeCards from './components/home-cards.vue'

import RoomsIcon from './icons/rooms.vue'
import StrategyIcon from './icons/strategy.vue'
import VisionIcon from './icons/vision.vue'
import AnalyticsIcon from './icons/analytics.vue'

// 模块加载即刻顶层注册 4 个 Koishi 标准 512x512 剪影图标（与官方插件架构完全一致）
icons.register('activity:rpsluna-rooms', RoomsIcon)
icons.register('activity:rpsluna-strategy', StrategyIcon)
icons.register('activity:rpsluna-vision', VisionIcon)
icons.register('activity:rpsluna-analytics', AnalyticsIcon)

export default (ctx: Context) => {
  // 0. 控制台首页全局插槽注入：7 大形态全域指挥大盘
  ctx.slot({
    type: 'home',
    component: HomeCards,
    order: 500, // 优雅插入在 Welcome 欢迎横幅下方与数据网格之间
  })

  // 1. 房间管理与实时调度页面
  ctx.page({
    id: 'rpsluna-rooms',
    name: 'RPS 房间调度',
    path: '/rpsluna/rooms',
    component: RoomsPage,
    icon: 'activity:rpsluna-rooms',
    order: 510,
  })

  // 2. AI 策略与心智大脑大盘
  ctx.page({
    id: 'rpsluna-strategy',
    name: 'RPS 策略大脑',
    path: '/rpsluna/strategy',
    component: StrategyPage,
    icon: 'activity:rpsluna-strategy',
    order: 511,
  })

  // 3. 视觉手势识别与外设伴侣
  ctx.page({
    id: 'rpsluna-vision',
    name: 'RPS 视觉设备',
    path: '/rpsluna/vision',
    component: VisionPage,
    icon: 'activity:rpsluna-vision',
    order: 512,
  })

  // 4. 全域战绩天梯与大屏监控
  ctx.page({
    id: 'rpsluna-analytics',
    name: 'RPS 赛事天梯',
    path: '/rpsluna/analytics',
    component: AnalyticsPage,
    icon: 'activity:rpsluna-analytics',
    order: 513,
  })
}
