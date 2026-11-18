<template>
  <k-layout main="darker" class="page-rooms">
    <el-scrollbar>
      <div class="rps-console-page">
    <div class="page-header">
      <div class="header-title">
        <h2>🕹️ 对战大厅与房间调度</h2>
        <span class="subtitle">实时监控 RPS 多模态博弈房间，动态干预出拳策略与对战节奏</span>
      </div>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="fetchRooms" :loading="loading">
          🔄 刷新战况
        </el-button>
        <el-button type="success" size="small" @click="openPortal">
          🌐 访问大屏 (8498)
        </el-button>
      </div>
    </div>

    <!-- 房间列表 -->
    <div class="room-grid" v-if="rooms.length > 0">
      <div v-for="room in rooms" :key="room.id" class="k-card room-card">
        <div class="room-header">
          <div class="room-title-box">
            <span class="room-name">{{ room.name }}</span>
            <span class="room-id">ID: {{ room.id }}</span>
          </div>
          <el-tag :type="room.state === 'idle' ? 'success' : 'warning'" size="small">
            {{ room.state === 'idle' ? '🟢 就绪等待' : '⚔️ 博弈中' }}
          </el-tag>
        </div>

        <!-- 战绩统计栏 -->
        <div class="room-stats">
          <div class="stat-pill">
            <span class="stat-num">{{ room.stats.total }}</span>
            <span class="stat-lbl">总局数</span>
          </div>
          <div class="stat-pill win">
            <span class="stat-num">{{ room.stats.playerWins }}</span>
            <span class="stat-lbl">玩家胜</span>
          </div>
          <div class="stat-pill lose">
            <span class="stat-num">{{ room.stats.aiWins }}</span>
            <span class="stat-lbl">AI 胜</span>
          </div>
          <div class="stat-pill draw">
            <span class="stat-num">{{ room.stats.draws }}</span>
            <span class="stat-lbl">平局</span>
          </div>
          <div class="stat-pill rate">
            <span class="stat-num">{{ room.stats.winRate }}%</span>
            <span class="stat-lbl">胜率</span>
          </div>
        </div>

        <!-- 策略与模式调控 -->
        <div class="room-controls">
          <div class="control-row">
            <span class="label">博弈大脑:</span>
            <el-select
              size="small"
              v-model="room.strategy"
              @change="(val) => updateRoom(room.id, 'set-strategy', val)"
              placeholder="选择策略"
              style="width: 190px;"
            >
              <el-option
                v-for="s in strategies"
                :key="s.name"
                :label="s.displayName"
                :value="s.name"
              />
            </el-select>
          </div>

          <div class="control-row">
            <span class="label">对决节奏:</span>
            <el-select
              size="small"
              v-model="room.rhythmMode"
              @change="(val) => updateRoom(room.id, 'set-rhythm', val)"
              style="width: 190px;"
            >
              <el-option label="回合倒计时 (3, 2, 1)" value="countdown" />
              <el-option label="自由瞬时判定" value="continuous" />
            </el-select>
          </div>
        </div>

        <!-- 快速虚拟出拳测试 -->
        <div class="quick-play">
          <span class="label">后台虚拟过招:</span>
          <div class="play-btns">
            <el-button size="small" @click="simulatePlay(room.id, 'rock')">🪨 石头</el-button>
            <el-button size="small" @click="simulatePlay(room.id, 'scissors')">✂️ 剪刀</el-button>
            <el-button size="small" @click="simulatePlay(room.id, 'paper')">🖐️ 布</el-button>
            <el-button size="small" type="danger" plain @click="resetStats(room.id)">清空战绩</el-button>
          </div>
        </div>

        <!-- 最近战报列表 -->
        <div class="recent-records" v-if="room.history && room.history.length > 0">
          <div class="recent-title">最近对战流水:</div>
          <div class="record-scroll">
            <div v-for="rec in [...room.history].reverse().slice(0, 5)" :key="rec.id" class="record-item">
              <span class="rec-round">#{{ rec.id }}</span>
              <span class="rec-moves">玩家 {{ emoji(rec.playerChoice) }} vs AI {{ emoji(rec.aiChoice) }}</span>
              <el-tag
                size="small"
                :type="rec.outcome === 'win' ? 'success' : rec.outcome === 'lose' ? 'danger' : 'info'"
              >
                {{ rec.outcome === 'win' ? '玩家胜' : rec.outcome === 'lose' ? 'AI 胜' : '平局' }}
              </el-tag>
              <span class="rec-comment" v-if="rec.commentary">"{{ rec.commentary }}"</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-box k-card">
      <span>正在连接 rpsluna 博弈服务，暂无活跃房间...</span>
    </div>
  </div>
    </el-scrollbar>
  </k-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useContext } from '@koishijs/client'

const ctx = useContext()
const rooms = ref<any[]>([])
const strategies = ref<any[]>([])
const loading = ref(false)
const portalUrl = ref('http://localhost:8498')

const emoji = (c: string) => {
  if (c === 'rock') return '🪨'
  if (c === 'scissors') return '✂️'
  if (c === 'paper') return '🖐️'
  return c
}

const fetchRooms = async () => {
  loading.value = true
  try {
    const res = await (ctx as any).console?.fetch?.('rpsluna/get-rooms')
    if (res) {
      rooms.value = res.rooms || []
      portalUrl.value = res.portalUrl || portalUrl.value
    }
    const strats = await (ctx as any).console?.fetch?.('rpsluna/get-strategies')
    if (strats) {
      strategies.value = strats
    }
  } catch (err) {
    console.error('获取房间失败:', err)
  } finally {
    loading.value = false
  }
}

const updateRoom = async (roomId: string, action: string, value: any) => {
  try {
    await (ctx as any).console?.fetch?.('rpsluna/update-room', { roomId, action, value })
    await fetchRooms()
  } catch (err) {
    console.error('更新房间设置失败:', err)
  }
}

const resetStats = async (roomId: string) => {
  await updateRoom(roomId, 'reset-stats', null)
}

const simulatePlay = async (roomId: string, choice: string) => {
  try {
    await (ctx as any).console?.fetch?.('rpsluna/simulate-round', { roomId, choice })
    await fetchRooms()
  } catch (err) {
    console.error('出拳测试失败:', err)
  }
}

const openPortal = () => {
  window.open(portalUrl.value, '_blank')
}

let timer: any = null
onMounted(() => {
  fetchRooms()
  timer = setInterval(fetchRooms, 3000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.page-rooms {
  height: 100%;
}
.rps-console-page {
  padding: 1.5rem 2rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--k-color-divider, rgba(255, 255, 255, 0.1));
}
.header-title h2 {
  font-size: 1.35rem;
  margin: 0;
  font-weight: 600;
  color: var(--k-text-dark, #fff);
}
.subtitle {
  font-size: 0.85rem;
  color: var(--k-text-light, #94a3b8);
}
.room-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 1.25rem;
}
.room-card {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.room-title-box {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.room-name {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--k-color-primary, #38bdf8);
}
.room-id {
  font-size: 0.75rem;
  color: var(--k-text-light, #64748b);
}
.room-stats {
  display: flex;
  justify-content: space-between;
  background: var(--bg2, rgba(0, 0, 0, 0.2));
  padding: 0.75rem;
  border-radius: 6px;
}
.stat-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stat-num {
  font-size: 1.15rem;
  font-weight: 700;
}
.stat-lbl {
  font-size: 0.72rem;
  color: var(--k-text-light, #94a3b8);
}
.stat-pill.win .stat-num { color: #4ade80; }
.stat-pill.lose .stat-num { color: #f87171; }
.stat-pill.draw .stat-num { color: #fbbf24; }
.stat-pill.rate .stat-num { color: var(--k-color-primary, #38bdf8); }

.room-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}
.quick-play {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--bg1, rgba(255, 255, 255, 0.02));
  padding: 0.6rem;
  border-radius: 6px;
}
.play-btns {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.recent-records {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.recent-title {
  font-size: 0.8rem;
  color: var(--k-text-light, #94a3b8);
}
.record-scroll {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.record-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  background: var(--bg2, rgba(0, 0, 0, 0.1));
  border-radius: 4px;
}
.rec-round {
  color: var(--k-text-light, #64748b);
  min-width: 25px;
}
.rec-moves {
  font-weight: 500;
}
.rec-comment {
  font-style: italic;
  font-size: 0.75rem;
  color: var(--k-color-primary, #38bdf8);
  margin-left: auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}
.empty-box {
  padding: 2.5rem;
  text-align: center;
  color: var(--k-text-light, #64748b);
}
</style>
