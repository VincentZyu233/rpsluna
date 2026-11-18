<template>
  <k-layout main="darker" class="page-strategy">
    <el-scrollbar>
      <div class="rps-console-page">
    <div class="page-header">
      <div class="header-title">
        <h2>🧠 AI 策略与心智大脑大盘</h2>
        <span class="subtitle">全景透视 RPS 赛博博弈算法群：从马尔可夫转移矩阵到大语言模型心理战</span>
      </div>
    </div>

    <!-- 策略家族卡片群 -->
    <div class="strategy-list">
      <div class="k-card strat-card" :class="{ active: currentTab === 'markov' }" @click="currentTab = 'markov'">
        <div class="strat-header">
          <span class="strat-icon">📈</span>
          <div>
            <div class="strat-name">Markov 转移矩阵</div>
            <div class="strat-desc">二阶条件概率转移预测</div>
          </div>
        </div>
        <el-tag size="small" type="success">经典统计学</el-tag>
      </div>

      <div class="k-card strat-card" :class="{ active: currentTab === 'iocaine' }" @click="currentTab = 'iocaine'">
        <div class="strat-header">
          <span class="strat-icon">🧪</span>
          <div>
            <div class="strat-name">Iocaine Powder 大师</div>
            <div class="strat-desc">6大预测子博弈与置信度评估</div>
          </div>
        </div>
        <el-tag size="small" type="primary">天梯博弈论</el-tag>
      </div>

      <div class="k-card strat-card" :class="{ active: currentTab === 'llm' }" @click="currentTab = 'llm'">
        <div class="strat-header">
          <span class="strat-icon">🤖</span>
          <div>
            <div class="strat-name">LLM 心理战读心大师</div>
            <div class="strat-desc">大模型思维链推理与嘲讽台词</div>
          </div>
        </div>
        <el-tag size="small" type="warning">认知心理战</el-tag>
      </div>

      <div class="k-card strat-card" :class="{ active: currentTab === 'cheat' }" @click="currentTab = 'cheat'">
        <div class="strat-header">
          <span class="strat-icon">⚡</span>
          <div>
            <div class="strat-name">瞬时读心外挂 (Visual)</div>
            <div class="strat-desc">最后一帧手势提取与瞬杀克制</div>
          </div>
        </div>
        <el-tag size="small" type="danger">降维外挂</el-tag>
      </div>
    </div>

    <!-- 详情展示区域 -->
    <div class="detail-container k-card">
      <!-- Markov 视图 -->
      <div v-if="currentTab === 'markov'" class="tab-content">
        <h3>📊 马尔可夫二阶转移概率热力网格</h3>
        <p class="section-desc">AI 实时维护上两局玩家历史对决行为分布，动态构建出拳转移矩阵。</p>
        <div class="matrix-grid">
          <div class="matrix-cell header">历史前手 \ 下一步</div>
          <div class="matrix-cell header">🪨 石头</div>
          <div class="matrix-cell header">✂️ 剪刀</div>
          <div class="matrix-cell header">🖐️ 布</div>

          <div class="matrix-cell label">前次出 🪨 石头</div>
          <div class="matrix-cell val">22%</div>
          <div class="matrix-cell val highlight">56% (AI出石头克制)</div>
          <div class="matrix-cell val">22%</div>

          <div class="matrix-cell label">前次出 ✂️ 剪刀</div>
          <div class="matrix-cell val highlight">48% (AI出布克制)</div>
          <div class="matrix-cell val">26%</div>
          <div class="matrix-cell val">26%</div>

          <div class="matrix-cell label">前次出 🖐️ 布</div>
          <div class="matrix-cell val">30%</div>
          <div class="matrix-cell val">25%</div>
          <div class="matrix-cell val highlight">45% (AI出剪刀克制)</div>
        </div>
      </div>

      <!-- Iocaine 视图 -->
      <div v-if="currentTab === 'iocaine'" class="tab-content">
        <h3>🧪 Iocaine Powder 多预测子权重竞技场</h3>
        <p class="section-desc">国际猜拳算法大赛传奇冠军模型：同时维护 6 种不同思维深度的预测子，以历史表现动态分配投票权重。</p>
        <div class="iocaine-predictors">
          <div class="pred-item" v-for="p in predictors" :key="p.name">
            <div class="pred-title">
              <span>{{ p.name }} ({{ p.desc }})</span>
              <span class="pred-weight">权重: {{ p.weight }}%</span>
            </div>
            <el-progress :percentage="p.weight" :color="p.color" />
          </div>
        </div>
      </div>

      <!-- LLM 视图 -->
      <div v-if="currentTab === 'llm'" class="tab-content">
        <h3>🤖 LLM 认知心理战与读心嘲讽生成</h3>
        <p class="section-desc">基于大语言模型深度推理人类的“赌徒谬误”与反心理逻辑，并生成赛博嘲讽台词。</p>
        
        <div class="llm-box">
          <div class="prompt-preview">
            <span class="code-tag">System Prompt 心理战策略模版:</span>
            <pre>你是一位精通人类心理学与猜拳博弈的顶级赛博读心大师。
当前对决局数: 第 #8 局 | 玩家近期历史: [石头 -> 石头 -> 剪刀]
分析人类心理: 玩家连续出石头受挫后转出剪刀，大概率处于试探阶段，下一步极可能出布或复盘石头。
指令: 输出你的预判反制拳势，并给出 1 句不超过 20 字的精准扎心嘲讽台词。</pre>
          </div>

          <div class="mock-output">
            <div class="output-label">✨ 最新一次对决真实生成的读心嘲讽台词:</div>
            <div class="quote-card">
              "你的手指在颤抖，第三次换剪刀已经被我算死了。"
            </div>
          </div>
        </div>
      </div>

      <!-- Cheat 视图 -->
      <div v-if="currentTab === 'cheat'" class="tab-content">
        <h3>⚡ 视觉检测瞬时外挂模式</h3>
        <p class="section-desc">直接读取 YOLO11 在当前对决窗口内的最后一帧识别结果，在 5 毫秒内计算完胜拳形，AI 理论胜率 100%。</p>
        <el-alert
          title="⚠️ 娱乐/测试专用：开启本策略后人类几乎无法获胜，仅推荐用于演示视觉与硬件极低延迟响应。"
          type="error"
          show-icon
          :closable="false"
        />
      </div>
    </div>
  </div>
    </el-scrollbar>
  </k-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentTab = ref('markov')

const predictors = [
  { name: 'P0.Naive-Frequency', desc: '全历史朴素频次统计', weight: 15, color: '#94a3b8' },
  { name: 'P1.Recent-Repeat', desc: '玩家惯性重复侦测', weight: 28, color: '#38bdf8' },
  { name: 'P2.Anti-Cycle', desc: '反猜拳周期序列预测', weight: 24, color: '#818cf8' },
  { name: 'P3.Second-Order-Shift', desc: '二阶反制推演', weight: 18, color: '#4ade80' },
  { name: 'P4.Psychological-Trap', desc: '逆向心理陷阱', weight: 10, color: '#fbbf24' },
  { name: 'P5.Random-Entropy', desc: '防破解随机扰动', weight: 5, color: '#f87171' },
]
</script>

<style scoped>
.page-strategy {
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
.strategy-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.strat-card {
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid var(--k-color-border, #334155);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  transition: all 0.2s ease;
}
.strat-card:hover {
  border-color: var(--k-color-primary, #38bdf8);
}
.strat-card.active {
  border-color: var(--k-color-primary, #38bdf8);
  background: var(--bg2, rgba(56, 189, 248, 0.05));
}
.strat-header {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.strat-icon {
  font-size: 1.8rem;
}
.strat-name {
  font-weight: 600;
  font-size: 0.95rem;
}
.strat-desc {
  font-size: 0.75rem;
  color: var(--k-text-light, #94a3b8);
}
.detail-container {
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
}
.tab-content h3 {
  margin-top: 0;
  font-size: 1.15rem;
  color: var(--k-color-primary, #38bdf8);
}
.section-desc {
  font-size: 0.85rem;
  color: var(--k-text-light, #94a3b8);
  margin-bottom: 1.25rem;
}
.matrix-grid {
  display: grid;
  grid-template-columns: 140px repeat(3, 1fr);
  gap: 1px;
  background: var(--k-color-divider, #334155);
  border: 1px solid var(--k-color-divider, #334155);
  border-radius: 6px;
  overflow: hidden;
}
.matrix-cell {
  background: var(--k-card-bg, #1e293b);
  padding: 0.75rem;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
.matrix-cell.header {
  background: var(--bg2, #0f172a);
  font-weight: 600;
}
.matrix-cell.label {
  background: var(--bg2, #0f172a);
  font-weight: 500;
}
.matrix-cell.val.highlight {
  color: var(--k-color-primary, #38bdf8);
  font-weight: 600;
}
.iocaine-predictors {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pred-title {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  margin-bottom: 0.25rem;
}
.pred-weight {
  font-weight: 600;
  color: var(--k-color-primary, #38bdf8);
}
.llm-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.prompt-preview {
  background: var(--bg0, #090e17);
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid var(--k-color-border, #334155);
}
.code-tag {
  font-size: 0.75rem;
  color: var(--k-text-light, #64748b);
  display: block;
  margin-bottom: 0.5rem;
}
pre {
  margin: 0;
  font-family: inherit;
  font-size: 0.82rem;
  line-height: 1.5;
  color: var(--k-text-normal, #cbd5e1);
  white-space: pre-wrap;
}
.quote-card {
  font-size: 1.1rem;
  font-style: italic;
  padding: 1rem;
  background: var(--bg2, rgba(56, 189, 248, 0.08));
  border-left: 4px solid var(--k-color-primary, #38bdf8);
  border-radius: 0 6px 6px 0;
  color: var(--k-text-dark, #fff);
}
.output-label {
  font-size: 0.85rem;
  color: var(--k-text-light, #94a3b8);
  margin-bottom: 0.5rem;
}
</style>
