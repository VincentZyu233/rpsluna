<template>
  <k-layout main="darker" class="page-analytics">
    <el-scrollbar>
      <div class="rps-console-page">
        <!-- 页面顶部横幅 -->
        <div class="page-header">
          <div class="header-title">
            <h2>📊 全域战绩天梯与大屏监控</h2>
            <span class="subtitle">人类 vs AI 胜负宏观统计、OBS 直播推流浏览器源与大屏赛事分发</span>
          </div>
          <div class="header-actions">
            <el-button size="small" type="success" @click="copyPortalUrl">
              📋 复制大屏直连链接
            </el-button>
            <el-button size="small" type="primary" @click="copyObsUrl">
              🎥 复制 OBS 浏览器源
            </el-button>
          </div>
        </div>

        <!-- 顶层关键指标 -->
        <div class="analytics-cards">
          <div class="k-card metric-card">
            <span class="metric-title">全域总博弈局数</span>
            <span class="metric-big-num">128</span>
            <span class="metric-sub">覆盖 Web、Bot 与外设全通道</span>
          </div>

          <div class="k-card metric-card">
            <span class="metric-title">人类总体胜率</span>
            <span class="metric-big-num text-win">24.2%</span>
            <span class="metric-sub">AI 压制率高达 75.8%</span>
          </div>

          <div class="k-card metric-card">
            <span class="metric-title">最高连胜英雄纪录</span>
            <span class="metric-big-num text-accent">5 连胜</span>
            <span class="metric-sub">玩家: @VincentZyu (打破AI预判)</span>
          </div>

          <div class="k-card metric-card">
            <span class="metric-title">最常出拳惯性</span>
            <span class="metric-big-num">🪨 石头 (42%)</span>
            <span class="metric-sub">其次为布 (33%)、剪刀 (25%)</span>
          </div>
        </div>

        <!-- 大屏投屏与赛事分发 -->
        <div class="portal-box k-card">
          <div class="portal-info">
            <h3>🌐 独立对战大屏与直播推流源 (Port 8498)</h3>
            <p class="desc">专为线下投影、展厅竞技以及 OBS 直播推流定制的独立全屏网页。</p>
            
            <div class="url-input-group">
              <div class="url-row">
                <span class="url-label">📱 玩家直连 / 手机扫码对决:</span>
                <el-input size="small" v-model="portalUrl" readonly style="max-width: 520px;">
                  <template #append>
                    <el-button @click="copyPortalUrl">复制</el-button>
                  </template>
                </el-input>
              </div>

              <div class="url-row">
                <span class="url-label">🎬 OBS 直播间透明覆盖层:</span>
                <el-input size="small" :model-value="portalUrl + '?theme=transparent&mode=obs'" readonly style="max-width: 520px;">
                  <template #append>
                    <el-button @click="copyObsUrl">复制</el-button>
                  </template>
                </el-input>
              </div>
            </div>
          </div>
        </div>

        <!-- 连胜英雄名人堂 -->
        <div class="hall-of-fame k-card">
          <h3>🏆 人类反抗军 · 连胜英雄名人堂</h3>
          <div class="hero-list">
            <div class="hero-item gold">
              <span class="rank-badge">🥇 Top 1</span>
              <span class="hero-name">VincentZyu</span>
              <span class="hero-mode">挑战策略: LLM 心理战读心大师</span>
              <span class="hero-score">5 连胜达成</span>
            </div>
            <div class="hero-item silver">
              <span class="rank-badge">🥈 Top 2</span>
              <span class="hero-name">CyberKnight</span>
              <span class="hero-mode">挑战策略: Iocaine Powder</span>
              <span class="hero-score">4 连胜达成</span>
            </div>
            <div class="hero-item bronze">
              <span class="rank-badge">🥉 Top 3</span>
              <span class="hero-name">Anonymous-Human</span>
              <span class="hero-mode">挑战策略: Markov 转移矩阵</span>
              <span class="hero-score">3 连胜达成</span>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </k-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { message } from '@koishijs/client'

const portalUrl = ref('http://localhost:8498')

const copyPortalUrl = () => {
  navigator.clipboard?.writeText(portalUrl.value)
  message?.success?.('已复制大屏链接到剪贴板！')
}

const copyObsUrl = () => {
  navigator.clipboard?.writeText(portalUrl.value + '?theme=transparent&mode=obs')
  message?.success?.('已复制 OBS 浏览器源链接到剪贴板！')
}
</script>

<style scoped>
.page-analytics {
  height: 100%;
}

.rps-console-page {
  padding: 1.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--k-color-divider, rgba(255, 255, 255, 0.1));
  padding-bottom: 0.75rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.header-title h2 {
  font-size: 1.35rem;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
  color: var(--k-text-dark, #fff);
}

.subtitle {
  font-size: 0.85rem;
  color: var(--k-text-light, #94a3b8);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.analytics-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.metric-card {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.metric-title {
  font-size: 0.82rem;
  color: var(--k-text-light, #94a3b8);
}

.metric-big-num {
  font-size: 1.6rem;
  font-weight: 700;
}

.metric-big-num.text-win {
  color: #4ade80;
}

.metric-big-num.text-accent {
  color: var(--k-color-primary, #38bdf8);
}

.metric-sub {
  font-size: 0.72rem;
  color: var(--k-text-light, #64748b);
}

.portal-box {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
}

.portal-box h3 {
  margin: 0 0 0.4rem 0;
  font-size: 1.05rem;
  color: var(--k-color-primary, #38bdf8);
}

.desc {
  font-size: 0.85rem;
  color: var(--k-text-light, #94a3b8);
  margin-bottom: 1rem;
}

.url-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.url-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.85rem;
  flex-wrap: wrap;
}

.url-label {
  min-width: 190px;
  color: var(--k-text-normal, #cbd5e1);
}

.hall-of-fame {
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid var(--k-color-border, #334155);
}

.hall-of-fame h3 {
  margin: 0 0 1rem 0;
  font-size: 1.05rem;
  color: var(--k-text-dark, #fff);
}

.hero-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.hero-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.65rem 1rem;
  border-radius: 6px;
  background: var(--bg2, rgba(0, 0, 0, 0.2));
  font-size: 0.85rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.rank-badge {
  font-weight: 700;
  min-width: 80px;
}

.hero-item.gold .rank-badge { color: #fbbf24; }
.hero-item.silver .rank-badge { color: #cbd5e1; }
.hero-item.bronze .rank-badge { color: #f97316; }

.hero-name {
  font-weight: 600;
  min-width: 140px;
}

.hero-mode {
  color: var(--k-text-light, #94a3b8);
}

.hero-score {
  font-weight: 600;
  color: #4ade80;
}
</style>
