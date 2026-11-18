const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>🤖 rpsluna 跨平台聊天指令与交互卡片 (adapter-satori-command)</h1>
<p>基于 Satori 协议为 QQ 官方 Bot、Telegram、Discord、KOOK 等群聊与私聊提供富交互卡片出拳支持。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #818cf8; border-radius: 8px; background: rgba(129, 140, 248, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>💬 原生卡片按钮免打字：</b><br>
  在支持 Markdown/交互组件的平台（如 QQ 官方 Bot、Discord ActionRow），群友无需手动输入出拳文字，直接点击卡片上的【✊ 石头】、【✌️ 剪刀】、【🖐️ 布】即可瞬时下注。
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">📌 常用聊天指令大全</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• <code>rps</code>：直接在群聊唤起对战与交互按钮组；</p>
    <p>• <code>rps 石头 / 剪刀 / 布</code>：文字快速出拳；</p>
    <p>• <code>rps.stats</code>：查看本群/本频道的胜负天梯与人机压制率；</p>
    <p>• <code>rps.strategy &lt;markov|iocaine|llm&gt;</code>：切换当前群聊房间的 AI 心理战大脑。</p>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #10b981;">⚡ 自动连击对决</b></summary>
  <div style="${detailsBodyStyle}">
    <p>开启 <code>enableAutoNextRound</code> 后，每次胜负结算消息末尾都会自动吸附下一轮出拳按钮组，让群友一键继续连胜冲榜。</p>
  </div>
</details>
`
