const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>🌐 rpsluna 独立端口对战门户与直播推流源 (renderer-portal)</h1>
<p>运行于 <b>Port 8498</b> 的纯按键对决门户，免登录物理隔离，支持 FRP 穿透与 OBS 直播透明覆盖层。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #38bdf8; border-radius: 8px; background: rgba(56, 189, 248, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>🔗 独立按键对战门户入口：</b>
  <a href="http://localhost:8498" target="_blank" style="color: #38bdf8; font-weight: 700; text-decoration: underline;">
    http://localhost:8498
  </a>
  <span style="font-size: 0.85em; color: var(--k-text-light, #94a3b8); margin-left: 8px;">(与 Koishi 控制台物理隔离，外部玩家不可窥探后台)</span>
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #10b981;">🎥 OBS 直播间透明覆盖层使用方式</b></summary>
  <div style="${detailsBodyStyle}">
    <p>在 OBS Studio 中添加「浏览器」源，URL 填入：</p>
    <pre style="background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 6px; margin: 8px 0;"><code>http://localhost:8498?theme=transparent&mode=obs</code></pre>
    <p>页面背景将自动完全透明，仅保留出拳对抗、比分天平与连胜动效，完美贴合直播画面。</p>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #fbbf24;">🛡️ FRP 穿透与公网安全隔离</b></summary>
  <div style="${detailsBodyStyle}">
    <p>本端口仅暴露石头剪刀布对决接口与大屏视图，<b>不包含任何 Koishi 管理 API 或插件配置权限</b>。即使通过 FRP 映射到公网供观众扫码对战，也绝无被提权风险。</p>
  </div>
</details>
`
