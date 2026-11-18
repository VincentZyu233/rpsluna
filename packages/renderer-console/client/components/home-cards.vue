<template>
  <div class="rps-home-dashboard" v-if="visible">
    <!-- 顶部横幅栏与控制开关 -->
    <div class="dashboard-header">
      <div class="header-left">
        <span class="badge-tag">RPSLUNA ARENA</span>
        <h3 class="dashboard-title">赛博博弈竞技场 · 实时全域指挥大盘</h3>
      </div>
      <div class="header-right">
        <el-button size="small" text @click="isCollapsed = !isCollapsed">
          {{ isCollapsed ? '展开面板 ▾' : '收起面板 ▴' }}
        </el-button>
        <el-button size="small" type="primary" plain @click="fetchData" :loading="loading">
          🔄 刷新
        </el-button>
      </div>
    </div>

    <!-- 可折叠的主体卡片矩阵 -->
    <div v-show="!isCollapsed" class="dashboard-body">
      <!-- 梯队 1：核心实时动态双拼 -->
      <div class="row-grid two-col">
        <!-- 形态 1：双阵营对抗势能天平卡片 -->
        <div class="k-card card-item card-balance">
          <div class="card-head">
            <span class="card-title">⚔️ 人类 vs AI 阵营对抗实时势能</span>
            <span class="card-meta">总对局: {{ stats.total }} 局</span>
          </div>
          <div class="balance-container">
            <div class="balance-labels">
              <span class="side-label human">人类反抗军 ({{ humanRate }}%)</span>
              <span class="side-label ai">赛博 AI 大脑 ({{ aiRate }}%)</span>
            </div>
            <!-- 双色对抗拉锯条 -->
            <div class="progress-track">
              <div class="progress-bar human" :style="{ width: humanRate + '%' }"></div>
              <div class="progress-bar ai" :style="{ width: aiRate + '%' }"></div>
            </div>
            <div class="balance-footer">
              <span class="foot-item">🪨 玩家胜: {{ stats.playerWins }} 局</span>
              <span class="foot-item text-draw">🤝 平局: {{ stats.draws }} 局</span>
              <span class="foot-item text-danger">🤖 AI 胜: {{ stats.aiWins }} 局</span>
            </div>
          </div>
        </div>

        <!-- 形态 2：AI 读心冷嘲热讽引言卡片 (带打字机风格) -->
        <div class="k-card card-item card-quote">
          <div class="card-head">
            <span class="card-title">💬 LLM 读心大师 · 最新扎心嘲讽</span>
            <el-tag size="small" type="warning" effect="plain">认知心理战</el-tag>
          </div>
          <div class="quote-body">
            <div class="quote-content">
              “{{ displayedQuote }}<span class="cursor">|</span>”
            </div>
            <div class="quote-footer">
              <span class="model-info">🧠 策略: {{ currentStrategyName }}</span>
              <span class="room-info">房间: {{ lobbyRoomName }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 梯队 2：多模态软硬件与决策认知双拼 -->
      <div class="row-grid two-col">
        <!-- 形态 4 & 形态 5：左侧多模态视觉微缩雷达与外设矩阵 -->
        <div class="k-card card-item card-hardware">
          <div class="card-head">
            <span class="card-title">👁️ 视觉伴侣雷达与输入通道矩阵</span>
            <el-tag size="small" :type="visionOnline ? 'success' : 'info'">
              {{ visionOnline ? '🟢 伴侣在线' : '⚪ 伴侣待机' }}
            </el-tag>
          </div>
          <div class="hw-content">
            <!-- 视觉微缩推流窗 -->
            <div class="mini-vision-box">
              <img
                v-if="visionOnline"
                :src="visionStreamUrl"
                class="mini-stream"
                alt="YOLO11 stream"
                @error="visionOnline = false"
              />
              <div v-else class="vision-placeholder">
                <span>📸 YOLO11 推流就绪 (18082)</span>
              </div>
            </div>
            <!-- 外设指示灯矩阵 -->
            <div class="device-matrix">
              <div class="dev-row">
                <span class="dot green"></span>
                <span class="dev-name">⌨️ 窗口全局按键 (Num 1/2/3)</span>
                <span class="dev-tag">在线</span>
              </div>
              <div class="dev-row">
                <span class="dot green"></span>
                <span class="dev-name">🤖 Satori 富交互按钮 (QQ/TG/Discord)</span>
                <span class="dev-tag">免打字</span>
              </div>
              <div class="dev-row">
                <span class="dot yellow"></span>
                <span class="dev-name">🔌 物理街机硬件三色按键 (串口嗅探)</span>
                <span class="dev-tag">监听中</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 形态 3 & 形态 7：右侧手势偏好与马尔可夫决策矩阵 -->
        <div class="k-card card-item card-cognition">
          <div class="card-head">
            <span class="card-title">🖐️ 出拳惯性分布 & 马尔可夫 AI 脑波</span>
            <span class="card-meta">二阶统计模型</span>
          </div>

          <!-- 形态 3：手势三态胶囊分段条 -->
          <div class="gesture-segments">
            <div class="seg-labels">
              <span>🪨 石头 {{ gestureRates.rock }}%</span>
              <span>✂️ 剪刀 {{ gestureRates.scissors }}%</span>
              <span>🖐️ 布 {{ gestureRates.paper }}%</span>
            </div>
            <div class="seg-track">
              <div class="seg-bar rock" :style="{ width: gestureRates.rock + '%' }"></div>
              <div class="seg-bar scissors" :style="{ width: gestureRates.scissors + '%' }"></div>
              <div class="seg-bar paper" :style="{ width: gestureRates.paper + '%' }"></div>
            </div>
          </div>

          <!-- 形态 7：马尔可夫动态决策微热力矩阵 -->
          <div class="mini-markov">
            <div class="markov-title">AI 下一步即时克制推演 (前手 ➜ 克制):</div>
            <div class="markov-chips">
              <div class="chip">前手 🪨 ➜ 預判出 ✂️ ➜ <strong>AI 出 🪨 克制</strong></div>
              <div class="chip">前手 ✂️ ➜ 預判出 🪨 ➜ <strong>AI 出 🖐️ 克制</strong></div>
              <div class="chip">前手 🖐️ ➜ 預判出 🖐️ ➜ <strong>AI 出 ✂️ 克制</strong></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 梯队 3：形态 6 大屏推流快捷发车横幅卡片 -->
      <div class="k-card card-item card-banner">
        <div class="banner-left">
          <div class="banner-title-row">
            <span class="banner-icon">🚀</span>
            <span class="banner-main-title">RPS 赛博博弈独立竞技大屏 (Port 8498)</span>
            <el-tag size="small" type="success" effect="dark">公网隔离通道已连通</el-tag>
          </div>
          <p class="banner-desc">
            面向大屏投影、手机扫码即玩与 OBS 直播间透明覆盖层推流，专为多模态体感赛事分发打造。
          </p>
        </div>
        <div class="banner-right">
          <el-button type="primary" @click="openPortal">
            🌐 打开对战大屏
          </el-button>
          <el-button type="success" plain @click="copyObs">
            🎥 复制 OBS 链接
          </el-button>
          <el-button @click="gotoRooms">
            🕹️ 调度房间
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useContext, router } from '@koishijs/client'

const ctx = useContext()
const visible = ref(true)
const isCollapsed = ref(false)
const loading = ref(false)

const portalUrl = ref('http://localhost:8498')
const visionStreamUrl = ref('http://127.0.0.1:18082')
const visionOnline = ref(false)

const stats = ref({
  total: 0,
  playerWins: 0,
  aiWins: 0,
  draws: 0,
  winRate: '0.0',
})

const currentStrategyName = ref('LLM 心理战读心大师')
const lobbyRoomName = ref('RPS 赛博博弈竞技场')
const latestQuote = ref('“你的出拳逻辑在我的算法矩阵里纤毫毕现。”')
const displayedQuote = ref('')

const gestureRates = ref({
  rock: 42,
  scissors: 28,
  paper: 30,
})

const humanRate = computed(() => {
  if (stats.value.total === 0) return 33
  return Math.round((stats.value.playerWins / stats.value.total) * 100)
})

const aiRate = computed(() => {
  if (stats.value.total === 0) return 67
  return Math.round((stats.value.aiWins / stats.value.total) * 100)
})

// 打字机效果
let typeIndex = 0
let typeTimer: any = null
const startTypewriter = (text: string) => {
  displayedQuote.value = ''
  typeIndex = 0
  if (typeTimer) clearInterval(typeTimer)
  typeTimer = setInterval(() => {
    if (typeIndex < text.length) {
      displayedQuote.value += text[typeIndex]
      typeIndex++
    } else {
      clearInterval(typeTimer)
    }
  }, 45)
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await (ctx as any).console?.fetch?.('rpsluna/get-rooms')
    if (res && res.rooms && res.rooms.length > 0) {
      const lobby = res.rooms[0]
      stats.value = lobby.stats || stats.value
      lobbyRoomName.value = lobby.name || lobbyRoomName.value
      currentStrategyName.value = lobby.strategy || currentStrategyName.value
      portalUrl.value = res.portalUrl || portalUrl.value

      // 提取最新台词
      if (lobby.history && lobby.history.length > 0) {
        const lastWithComment = [...lobby.history].reverse().find(r => r.commentary)
        if (lastWithComment && lastWithComment.commentary) {
          if (latestQuote.value !== lastWithComment.commentary) {
            latestQuote.value = lastWithComment.commentary
            startTypewriter(latestQuote.value)
          }
        }
      }
    }

    // 探针检测伴侣
    const vRes = await (ctx as any).console?.fetch?.('rpsluna/get-vision-status')
    if (vRes) {
      visionOnline.value = vRes.isOnline
      visionStreamUrl.value = vRes.streamUrl || visionStreamUrl.value
    }
  } catch (err) {
    // 静默降级
  } finally {
    loading.value = false
  }
}

const openPortal = () => {
  window.open(portalUrl.value, '_blank')
}

const copyObs = () => {
  navigator.clipboard?.writeText(portalUrl.value + '?theme=transparent&mode=obs')
}

const gotoRooms = () => {
  router.push('/rpsluna/rooms')
}

let intervalTimer: any = null
onMounted(() => {
  startTypewriter(latestQuote.value)
  fetchData()
  intervalTimer = setInterval(fetchData, 4000)
})

onUnmounted(() => {
  if (typeTimer) clearInterval(typeTimer)
  if (intervalTimer) clearInterval(intervalTimer)
})
</script>

<style scoped lang="scss">
.rps-home-dashboard {
  margin: var(--card-margin);
  display: flex;
  flex-direction: column;
  gap: var(--card-margin);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.25rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.badge-tag {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background: var(--k-color-primary, #38bdf8);
  color: #fff;
}

.dashboard-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--k-text-dark, #fff);
}

.dashboard-body {
  display: flex;
  flex-direction: column;
  gap: var(--card-margin);
}

.row-grid {
  display: grid;
  gap: var(--card-margin);

  &.two-col {
    grid-template-columns: repeat(2, 1fr);

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
  }
}

.card-item {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
  background: var(--k-card-bg, #1e293b);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--k-text-dark, #fff);
}

.card-meta {
  font-size: 0.75rem;
  color: var(--k-text-light, #94a3b8);
}

/* 1. 势能天平卡片 */
.balance-container {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.balance-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  font-weight: 500;
}

.side-label.human {
  color: var(--k-color-primary, #38bdf8);
}

.side-label.ai {
  color: #f87171;
}

.progress-track {
  height: 12px;
  background: var(--bg0, #090e17);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
}

.progress-bar {
  height: 100%;
  transition: width 0.4s ease;

  &.human {
    background: linear-gradient(90deg, #0284c7, #38bdf8);
  }

  &.ai {
    background: linear-gradient(90deg, #ef4444, #f87171);
  }
}

.balance-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--k-text-light, #94a3b8);
}

.text-draw { color: #fbbf24; }
.text-danger { color: #f87171; }

/* 2. 读心台词卡片 */
.quote-body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  gap: 0.75rem;
}

.quote-content {
  font-size: 1.05rem;
  font-style: italic;
  line-height: 1.5;
  color: var(--k-text-dark, #fff);
  padding: 0.5rem 0.75rem;
  background: var(--bg2, rgba(56, 189, 248, 0.05));
  border-left: 3px solid var(--k-color-primary, #38bdf8);
  border-radius: 0 6px 6px 0;
  min-height: 52px;
}

.cursor {
  animation: blink 1s infinite;
  color: var(--k-color-primary, #38bdf8);
  font-weight: 700;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.quote-footer {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--k-text-light, #94a3b8);
}

/* 4 & 5. 硬件与视觉卡片 */
.hw-content {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 1rem;
  align-items: center;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.mini-vision-box {
  width: 140px;
  height: 90px;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--k-color-border, #334155);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.vision-placeholder {
  font-size: 0.7rem;
  color: var(--k-text-light, #64748b);
  text-align: center;
  padding: 0.5rem;
}

.device-matrix {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.dev-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;

  &.green {
    background: #4ade80;
    box-shadow: 0 0 6px #4ade80;
  }

  &.yellow {
    background: #fbbf24;
  }
}

.dev-name {
  color: var(--k-text-normal, #cbd5e1);
  flex: 1;
}

.dev-tag {
  font-size: 0.7rem;
  color: var(--k-text-light, #64748b);
}

/* 3 & 7. 手势三态与微马尔可夫卡片 */
.gesture-segments {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.seg-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--k-text-normal, #cbd5e1);
}

.seg-track {
  height: 8px;
  border-radius: 4px;
  background: var(--bg0, #090e17);
  overflow: hidden;
  display: flex;
}

.seg-bar {
  height: 100%;
  &.rock { background: #38bdf8; }
  &.scissors { background: #f87171; }
  &.paper { background: #4ade80; }
}

.mini-markov {
  margin-top: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.markov-title {
  font-size: 0.78rem;
  color: var(--k-text-light, #94a3b8);
}

.markov-chips {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chip {
  font-size: 0.75rem;
  background: var(--bg2, rgba(0, 0, 0, 0.2));
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  color: var(--k-text-normal, #cbd5e1);

  strong {
    color: var(--k-color-primary, #38bdf8);
  }
}

/* 6. 大屏推流快捷发车横幅 */
.card-banner {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%);
  border: 1px solid rgba(56, 189, 248, 0.3);

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}

.banner-left {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.banner-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.banner-icon {
  font-size: 1.25rem;
}

.banner-main-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--k-text-dark, #fff);
}

.banner-desc {
  margin: 0;
  font-size: 0.8rem;
  color: var(--k-text-light, #94a3b8);
}

.banner-right {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
