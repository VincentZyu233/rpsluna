const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>📹 rpsluna 窗口捕获推流网关 (向后兼容层)</h1>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #fbbf24; border-radius: 8px; background: rgba(251, 191, 36, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>💡 架构演进说明：</b><br>
  <code>rpsluna-adapter-window</code> 已全量升级整合为 <code>rpsluna-adapter-vision</code> (视觉体感中心与 9498 商显大屏)。<br>
  本插件保留为向后兼容层，当前运行会自动透传并启动 <code>adapter-vision</code> 服务，建议在配置文件中直接迁移为 <code>rpsluna-adapter-vision</code>。
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">🌐 访问全新商显大屏与推流网关</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• 大屏地址：<a href="http://localhost:9498" target="_blank" style="color: #38bdf8;">http://localhost:9498</a></p>
    <p>• YOLO 推流：<code>ws://127.0.0.1:9498/gesture-stream</code></p>
  </div>
</details>
`
