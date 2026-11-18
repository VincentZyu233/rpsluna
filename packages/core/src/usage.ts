const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>👑 rpsluna 核心服务与调度状态机引擎</h1>
<p>提供多模态石头剪刀布核心驱动服务（<code>ctx.rpsluna</code>），统筹房间调度、事件广播、出拳仲裁与多策略协同。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #38bdf8; border-radius: 8px; background: rgba(56, 189, 248, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>核心服务声明：</b><br>
  本插件提供全局服务名 <code>rpsluna</code>，是所有输入适配器 (adapter)、对战算法 (strategy) 和渲染大屏 (renderer) 的基础依赖服务。
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">🕹️ 多房间调度机制 (Room Lifecycle)</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• <b>房间隔离</b>：支持多端、多群聊独立开局，每个房间维护独立的胜负流水与出拳历史；</p>
    <p>• <b>倒计时仲裁</b>：核心提供统一的倒计时滴答调度，超时自动结算并触发回合广播；</p>
    <p>• <b>策略热插拔</b>：支持动态切换房间绑定的博弈策略（如从随机切换为 LLM 心理战）。</p>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #10b981;">📡 全域生命周期事件监听规范</b></summary>
  <div style="${detailsBodyStyle}">
    <p>外部插件可通过 Koishi 事件系统直接监听对决生命周期：</p>
    <p>• <code>rpsluna/round-end</code>：单局出拳即时结算事件（带胜负、置信度与嘲讽台词）；</p>
    <p>• <code>rpsluna/strategy-registered</code>：新策略加载注册事件。</p>
  </div>
</details>
`
