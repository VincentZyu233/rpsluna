const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>📊 rpsluna 控制台可视化监控扩展 (renderer-console)</h1>
<p>深度内嵌于 Koishi 控制台侧边栏的原生扩展，提供全域战绩天梯、房间调度、策略大脑及视觉设备标定大盘。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #38bdf8; border-radius: 8px; background: rgba(56, 189, 248, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>零私开端口设计：</b><br>
  参考成熟工程范式（如 bili-live-music），运维大盘完全复用 Koishi 原生 HTTP/WebSocket 通道，<b>不占用任何额外端口</b>，左侧活动栏直达。
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">🧭 控制台 4 大专属扩展页面导航</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• <b>🏆 全域战绩天梯 (<a href="/rpsluna/analytics" style="color: #38bdf8;">/rpsluna/analytics</a>)</b>：胜负宏观统计、惯性出拳雷达与连胜英雄名人堂；</p>
    <p>• <b>🕹️ 房间调度大厅 (<a href="/rpsluna/rooms" style="color: #38bdf8;">/rpsluna/rooms</a>)</b>：多房间活跃监控、AI 策略热切换与实时战报流水；</p>
    <p>• <b>🧠 策略心智大脑 (<a href="/rpsluna/strategy" style="color: #38bdf8;">/rpsluna/strategy</a>)</b>：马尔可夫转移矩阵热力图、Iocaine 权重竞技场与大模型思维链预览；</p>
    <p>• <b>👁️ 视觉设备伴侣 (<a href="/rpsluna/vision" style="color: #38bdf8;">/rpsluna/vision</a>)</b>：YOLO11 ONNX 状态推流监视与外设矩阵。</p>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #10b981;">🏠 首页插槽自动注入</b></summary>
  <div style="${detailsBodyStyle}">
    <p>本插件会自动向 Koishi 概览首页注入「赛博博弈竞技场·实时指挥大盘」卡片群，无需跳转即可在首页一览全域人机势能天平与最新读心台词。</p>
  </div>
</details>
`
