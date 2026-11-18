const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>🎮 rpsluna 纯按键与物理硬件扩展 (adapter-buttons)</h1>
<p>为无摄像头环境、展厅街机物理三色外设按键及全键盘玩家提供 100% 稳定的出拳输入驱动。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #10b981; border-radius: 8px; background: rgba(16, 185, 129, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>零延迟兜底输入：</b><br>
  无论在 8498 纯按键 Portal 还是 9498 商显大屏上，按键出拳均享有最高优先级的瞬时状态推进，可作为无硬件或弱光环境下的最佳对战兜底。
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">⌨️ 键盘热键映射</b></summary>
  <div style="${detailsBodyStyle}">
    <p>• <code>[1]</code> 键：🪨 出石头</p>
    <p>• <code>[2]</code> 键：✂️ 出剪刀</p>
    <p>• <code>[3]</code> 键：🖐️ 出布</p>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #fbbf24;">🔌 物理硬件按键扩展支持</b></summary>
  <div style="${detailsBodyStyle}">
    <p>支持通过串口/USB 外设连接的工业级三色街机发光按键，接收脉冲信号秒级分发出拳。</p>
  </div>
</details>
`
