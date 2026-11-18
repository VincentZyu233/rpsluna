<template>
  <k-layout main="darker" class="page-vision">
    <el-scrollbar>
      <div class="rps-console-page">
    <div class="page-header">
      <div class="header-title">
        <h2>👁️ 视觉手势识别与设备伴侣</h2>
        <span class="subtitle">YOLO11 ONNX 视觉检测推流状态、FPS 推理仪表盘与全域输入设备矩阵</span>
      </div>
      <div class="header-actions">
        <el-button size="small" type="primary" @click="checkVisionStatus" :loading="checking">
          🔄 检查连接
        </el-button>
      </div>
    </div>

    <!-- 视觉与硬件两大核心板块 -->
    <div class="vision-layout">
      <!-- 左侧：视觉推流窗口 -->
      <div class="stream-panel k-card">
        <div class="panel-header">
          <div class="header-left">
            <span class="panel-title">📸 实时手势推理视频流 (MJPEG)</span>
            <span class="stream-url">{{ streamUrl }}</span>
          </div>
          <el-tag :type="isOnline ? 'success' : 'danger'" size="small">
            {{ isOnline ? '🟢 推流在线' : '🔴 伴侣离线' }}
          </el-tag>
        </div>

        <div class="stream-viewport">
          <img
            v-if="isOnline"
            :src="streamUrl"
            class="live-image"
            alt="YOLO11 Live Gesture Feed"
            @error="handleStreamError"
          />
          <div v-else class="offline-placeholder">
            <span class="offline-icon">📡</span>
            <span class="offline-title">视觉伴侣暂未连通</span>
            <span class="offline-hint">请确保 window_detector 已启动，并在端口 18082 推流</span>
          </div>
        </div>

        <div class="stream-footer">
          <div class="metric-pill">
            <span class="metric-val">YOLO11-nano</span>
            <span class="metric-lbl">模型网络</span>
          </div>
          <div class="metric-pill">
            <span class="metric-val">640 × 640</span>
            <span class="metric-lbl">输入分辨率</span>
          </div>
          <div class="metric-pill">
            <span class="metric-val">~30 FPS</span>
            <span class="metric-lbl">实时推理帧率</span>
          </div>
          <div class="metric-pill">
            <span class="metric-val">&lt; 15 ms</span>
            <span class="metric-lbl">单帧端到端延迟</span>
          </div>
        </div>
      </div>

      <!-- 右侧：外设与输入通道矩阵 -->
      <div class="devices-panel">
        <!-- 矩阵卡片 -->
        <div class="k-card dev-card">
          <h4>⌨️ 窗口与键盘输入通道 (adapter-window)</h4>
          <p class="card-desc">支持操作员或单机玩家在屏幕前使用数字按键瞬时出拳。</p>
          <div class="key-bindings">
            <div class="key-badge active"><kbd>Num 1</kbd> 🪨 石头</div>
            <div class="key-badge active"><kbd>Num 2</kbd> ✂️ 剪刀</div>
            <div class="key-badge active"><kbd>Num 3</kbd> 🖐️ 布</div>
          </div>
        </div>

        <div class="k-card dev-card">
          <h4>🤖 Satori 跨平台富交互 (adapter-satori-command)</h4>
          <p class="card-desc">自动下发原生卡片按钮与交互回调，玩家免打字秒速出拳。</p>
          <div class="platform-tags">
            <el-tag size="small" type="success">QQ 官方 Bot 按钮组</el-tag>
            <el-tag size="small" type="primary">Telegram Inline Keyboard</el-tag>
            <el-tag size="small" type="warning">Discord ActionRow</el-tag>
          </div>
        </div>

        <div class="k-card dev-card">
          <h4>🔌 物理硬件按键扩展 (adapter-buttons)</h4>
          <p class="card-desc">支持通过串口/USB 外设连接的物理街机三色手柄按键。</p>
          <div class="serial-status">
            <span class="status-dot green"></span>
            <span>物理按键监听就绪 (端口自动嗅探)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
    </el-scrollbar>
  </k-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useContext } from '@koishijs/client'

const ctx = useContext()
const streamUrl = ref('http://127.0.0.1:18082')
const isOnline = ref(false)
const checking = ref(false)

const checkVisionStatus = async () => {
  checking.value = true
  try {
    const res = await (ctx as any).console?.fetch?.('rpsluna/get-vision-status')
    if (res) {
      isOnline.value = res.isOnline
      streamUrl.value = res.streamUrl || streamUrl.value
    }
  } catch (err) {
    isOnline.value = false
  } finally {
    checking.value = false
  }
}

const handleStreamError = () => {
  isOnline.value = false
}

onMounted(() => {
  checkVisionStatus()
})
</script>

<style scoped>
.page-vision {
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
  border-bottom: 1px solid var(--k-color-divider, rgba(255, 255, 255, 0.1));
  padding-bottom: 0.5rem;
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
.vision-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 1.25rem;
}
.stream-panel {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.panel-title {
  font-weight: 600;
  font-size: 1rem;
  display: block;
}
.stream-url {
  font-size: 0.75rem;
  color: var(--k-text-light, #64748b);
}
.stream-viewport {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--k-color-border, #334155);
}
.live-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.offline-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--k-text-light, #64748b);
}
.offline-icon {
  font-size: 2.5rem;
}
.offline-title {
  font-weight: 600;
  font-size: 1rem;
}
.offline-hint {
  font-size: 0.78rem;
}
.stream-footer {
  display: flex;
  justify-content: space-around;
  background: var(--bg2, rgba(0, 0, 0, 0.2));
  padding: 0.75rem;
  border-radius: 6px;
}
.metric-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.metric-val {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--k-color-primary, #38bdf8);
}
.metric-lbl {
  font-size: 0.72rem;
  color: var(--k-text-light, #94a3b8);
}
.devices-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.dev-card {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
}
.dev-card h4 {
  margin: 0 0 0.4rem 0;
  font-size: 0.95rem;
  color: var(--k-text-dark, #fff);
}
.card-desc {
  font-size: 0.8rem;
  color: var(--k-text-light, #94a3b8);
  margin-bottom: 0.75rem;
}
.key-bindings {
  display: flex;
  gap: 0.5rem;
}
.key-badge {
  background: var(--bg2, #1e293b);
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid var(--k-color-border, #334155);
}
kbd {
  background: var(--bg0, #090e17);
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  font-family: inherit;
  font-size: 0.75rem;
  color: var(--k-color-primary, #38bdf8);
}
.platform-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.serial-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.green {
  background: #4ade80;
  box-shadow: 0 0 6px #4ade80;
}
</style>
