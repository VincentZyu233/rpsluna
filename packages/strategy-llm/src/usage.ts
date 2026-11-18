const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>🤖 rpsluna 大模型认知心理战与读心嘲讽 (strategy-llm)</h1>
<p>利用思维链大语言模型推理人类的“赌徒谬误”与逆向博弈心理，并实时生成赛博嘲讽台词。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #f59e0b; border-radius: 8px; background: rgba(245, 158, 11, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>💬 认知心理战体验：</b><br>
  本策略不仅输出精准的克制拳形，还会结合上一局玩家的受挫心理生成一针见血的台词（如：<i>“你的手指在颤抖，第三次换剪刀已经被我看穿了。”</i>），直接推送到大屏与聊天平台。
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">🔑 API 接口与 NewAPI 接入配置</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• <b>兼容接口</b>：支持任何 OpenAI 标准规范（如 NewAPI、OneAPI、DeepSeek、GPT-4o-mini 等）；</p>
    <p>• <b>配置说明</b>：在 <code>endpoint</code> 填写 Base URL（如 <code>http://localhost:3000/v1</code>），在 <code>apiKey</code> 填写令牌；</p>
    <p>• <b>优雅降级</b>：未填写 Key 或请求超时时，会自动退化为离线启发式逻辑，保证对战永不卡顿。</p>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #10b981;">🎭 三种人格性格预设 (persona)</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• <b>毒舌傲娇对手 (toxic)</b>：冷嘲热讽，专挑人类心理防线弱点击破；</p>
    <p>• <b>冷静心理学教授 (professor)</b>：引用博弈论与决策树分析你的概率偏差；</p>
    <p>• <b>中二宿命博弈家 (chuuni)</b>：将猜拳升华为操纵因果律与命运之线的对决。</p>
  </div>
</details>
`
