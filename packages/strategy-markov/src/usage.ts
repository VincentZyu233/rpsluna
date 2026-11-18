const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>📈 rpsluna 马尔可夫转移矩阵策略 (strategy-markov)</h1>
<p>基于经典统计学与条件概率论的石头剪刀布习惯学习模型。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #10b981; border-radius: 8px; background: rgba(16, 185, 129, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>智能自适应模式（adaptive）基石：</b><br>
  在商显大屏的“四阶段智能读心”算法中，本插件承载<b>第二阶段（习惯建模期）</b>的核心推理能力，是自适应模式的强制前置依赖。
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">⚙️ 调参指南</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• <b>转移阶数 (order)</b>：默认 <code>2</code>，表示记住玩家最近 2 次连续出拳习惯。如果面对儿童或新手，建议保持 2 阶；面对老玩家可尝试调为 3 阶；</p>
    <p>• <b>记忆衰减率 (decayFactor)</b>：默认 <code>0.85</code>，越靠近当前对局的行为权重越大，能快速捕捉到玩家“忽然改变出拳习惯”的瞬间；</p>
    <p>• <b>随机探索率 (randomExploreRate)</b>：默认 <code>5%</code>，偶尔加入随机扰动，防止博弈陷入死循环或被对手反制。在面对未知对手时能够有效刺探出拳反应。</p>
  </div>
</details>
`
