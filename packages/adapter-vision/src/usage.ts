const detailsStyle = 'margin:10px 0;border:1px solid var(--k-color-border, #909399);border-radius:8px;background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);overflow:hidden;box-shadow:var(--k-card-shadow, 0 1px 3px rgb(0 0 0 / 12%));'
const summaryStyle = 'padding:9px 12px;background:var(--k-hover-bg, rgba(127, 127, 127, .12));color:var(--k-text-dark, inherit);cursor:pointer;user-select:none;font-weight:600;'
const detailsBodyStyle = 'padding:10px 14px;border-top:1px solid var(--k-color-divider, rgba(127, 127, 127, .28));background:var(--k-card-bg, transparent);color:var(--k-text-dark, inherit);line-height:1.6;'

export const usage = `
<h1>🎯 rpsluna 视觉体感中心与 9498 商显互动大屏</h1>
<p>专为 65 寸+ 商显触控大屏、展厅体感竞技及 YOLO 视觉手势推流打造的核心中心插件。</p>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #38bdf8; border-radius: 8px; background: rgba(56, 189, 248, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b>🌐 外部商显体感大屏直连入口：</b>
  <a href="http://localhost:9498" target="_blank" style="color: #38bdf8; font-weight: 700; text-decoration: underline;">
    http://localhost:9498
  </a>
  <span style="font-size: 0.85em; color: var(--k-text-light, #94a3b8); margin-left: 8px;">(单端口复合架构：同时伺服 Kiosk 大屏与 WebSocket 推流)</span>
</blockquote>

<blockquote style="margin: 14px 0; padding: 12px 16px; border-left: 6px solid #ef4444; border-radius: 8px; background: rgba(239, 68, 68, 0.1); color: var(--k-text-dark, inherit); line-height: 1.6;">
  <b style="color: #ef4444;">⚠️ 智能自适应模式 (adaptive) 强依赖前置说明：</b><br>
  智能自适应四阶段读心算法强制要求同时启用以下前置策略插件：<br>
  1. <code>koishi-plugin-rpsluna-strategy-markov</code> (马尔可夫转移矩阵)<br>
  2. <code>koishi-plugin-rpsluna-strategy-all</code> (Iocaine Powder 算法群)<br>
  <i><b>最高工程准则 (Fail-Fast)</b>：若未检测到上述策略插件，本插件在启动时将拒绝加载并直接抛错停机，绝不默默缩水运行！</i>
</blockquote>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #38bdf8;">📹 Python YOLO11 伴侣推流快速接入指引</b></summary>
  <div style="${detailsBodyStyle}">
    <p>视觉伴侣位于 <code>tools/window_detector/detector.py</code>，使用 <code>uv</code> 驱动的轻量 YOLO11 ONNX 神经网络：</p>
    <pre style="background: rgba(0,0,0,0.3); padding: 8px 12px; border-radius: 6px; margin: 8px 0;"><code># 进入伴侣脚本目录并启动 (默认推流至 ws://127.0.0.1:9498/gesture-stream)
cd tools/window_detector
uv run detector.py</code></pre>
    <p>• <b>窗口捕获</b>：支持通过序号、窗口标题关键字或进程名捕获手机投屏（如 RustDesk、iQOO）；</p>
    <p>• <b>推流网关</b>：单端口统一开放于 <code>ws://localhost:9498/gesture-stream</code>，延迟低于 15ms。</p>
  </div>
</details>

<details style="${detailsStyle}">
  <summary style="${summaryStyle}"><b style="color: #10b981;">🎨 三大商用场景皮肤风格说明</b></summary>
  <div style="${detailsBodyStyle}">
    <p>可在配置项 <code>kioskSkin</code> 中动态指定：</p>
    <p>• <b>高校与电竞 (cyber)</b>：暗黑霓虹赛博机能风，高频打击光效与残影拖尾；</p>
    <p>• <b>商场中庭快闪 (atrium)</b>：高明度纯净极简白，大字号导视与醒目胜负结算；</p>
    <p>• <b>低幼与展厅 (kids)</b>：高饱和童趣像素风，加大放水机制与互动鼓励彩蛋。</p>
  </div>
</details>
`
