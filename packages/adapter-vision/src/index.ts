import { Context, Schema } from 'koishi'
import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { Choice } from 'koishi-plugin-rpsluna-core'
import { usage } from './usage'

export const name = 'rpsluna-adapter-vision'
export { usage }

export interface Config {
  port: number
  host: string
  defaultRoomId: string
  defaultDifficulty: 'adaptive' | 'easy' | 'normal' | 'hard' | 'cheat'
  enableDifficultySelector: boolean
  kioskSkin: 'cyber' | 'atrium' | 'kids'
}

export const Config: Schema<Config> = Schema.object({
  port: Schema.union([
    Schema.natural().max(65535),
    Schema.transform(Schema.string(), (v) => {
      const n = parseInt(v, 10)
      if (isNaN(n) || n < 0 || n > 65535) throw new Error('端口必须是 0-65535 之间的整数')
      return n
    }),
  ]).default(9498).description('视觉体感大屏与推流网关端口 (默认 9498)'),
  host: Schema.string().default('0.0.0.0').description('监听的主机地址 (0.0.0.0 允许全域网访问)'),
  defaultRoomId: Schema.string().default('default').description('默认交互对决房间 ID'),
  defaultDifficulty: Schema.union([
    Schema.const('adaptive').description('🧠 智能自适应大脑模式 (需前置 markov 与 all 插件)'),
    Schema.const('easy').description('🌱 轻松娱乐模式 (高概率放水)'),
    Schema.const('normal').description('⚖️ 经典平衡模式 (真随机博弈)'),
    Schema.const('hard').description('🔥 绝对读心模式 (全开压制)'),
    Schema.const('cheat').description('⚡ 最后一帧降维外挂模式 (测试专用)'),
  ]).default('adaptive').description('默认启动博弈对决算法模式'),
  enableDifficultySelector: Schema.boolean().default(true).description('是否在外部交互大屏显示难度调整控件'),
  kioskSkin: Schema.union([
    Schema.const('cyber').description('高校与电竞·赛博霓虹机能风'),
    Schema.const('atrium').description('商场快闪中庭·高明度极简明朗风'),
    Schema.const('kids').description('低幼与展厅·超大字号童趣像素风'),
  ]).default('cyber').description('大屏默认交互视觉皮肤'),
}).description('基础交互与端口设置')

export function apply(ctx: Context, config: Config) {
  ctx.inject(['rpsluna'], (ctx) => {
    // 1. 注册核心输入适配器
    ctx.rpsluna.registerAdapter({
      name: 'vision',
      displayName: '视觉手势体感 (Vision YOLO11 / Kiosk)',
      description: '高刷商显大屏互动舞台与 YOLO11 视觉手势推流网关 (Port 9498)',
    })

    // 2. 状态维护
    let lastGestureChoice: Choice | null = null
    let lastGestureTime = 0
    let lastConfidence = 0.0
    let isCompanionOnline = false
    let companionTimer: any = null

    const touchCompanion = (choice: Choice, conf: number) => {
      lastGestureChoice = choice
      lastGestureTime = Date.now()
      lastConfidence = conf
      isCompanionOnline = true
      if (companionTimer) clearTimeout(companionTimer)
      companionTimer = setTimeout(() => {
        isCompanionOnline = false
      }, 3500)
    }

    // 3. 创建单端口复合 HTTP + WebSocket 服务器 (Port 9498)
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        return res.end()
      }

      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

      // A. 视觉状态查询 API (供控制台 vision.vue 和大屏调用)
      if (url.pathname === '/api/vision/status') {
        const room = ctx.rpsluna.getOrCreateRoom(config.defaultRoomId)
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        return res.end(JSON.stringify({
          isOnline: isCompanionOnline,
          port: config.port,
          streamUrl: `ws://${req.headers.host || '127.0.0.1:' + config.port}/gesture-stream`,
          lastChoice: lastGestureChoice,
          lastConfidence,
          lastSeen: lastGestureTime,
          difficulty: config.defaultDifficulty,
          skin: config.kioskSkin,
          room: {
            id: room.id,
            name: room.name,
            status: room.status,
            activeStrategy: room.activeStrategyName,
            countdownRemaining: room.countdownRemaining,
            stats: room.getStats(),
          },
        }))
      }

      // B. 模拟/按键操作 API
      if (url.pathname === '/api/action' && req.method === 'POST') {
        let body = ''
        req.on('data', chunk => (body += chunk))
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}')
            const choice = data.choice as Choice
            if (!['rock', 'paper', 'scissors'].includes(choice)) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              return res.end(JSON.stringify({ error: '无效出拳' }))
            }
            const record = await ctx.rpsluna.dispatchInput({
              roomId: config.defaultRoomId,
              choice,
              confidence: 1.0,
              provider: 'vision-kiosk-hud',
              timestamp: Date.now(),
            })
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify({ success: true, record }))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: err.message }))
          }
        })
        return
      }

      // C. 默认输出商显全屏互动大屏 Kiosk 页面
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(renderKioskHtml(config))
    })

    // 4. 挂载 WebSocket 服务
    const wss = new WebSocketServer({ server })
    const kioskClients = new Set<WebSocket>()

    wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
      const pathname = req.url?.split('?')[0] || '/'

      // 分流 A: 外部 Python 伴侣推流 (ws://localhost:9498/gesture-stream)
      if (pathname === '/gesture-stream' || pathname === '/gesture') {
        ctx.logger('rpsluna-vision').info(`📹 外部手势识别伴侣已连接推流管线: ${req.socket.remoteAddress}`)

        ws.on('message', async (data) => {
          try {
            const payload = JSON.parse(data.toString())
            const choice = payload.choice as Choice
            if (!['rock', 'paper', 'scissors'].includes(choice)) return

            const confidence = typeof payload.confidence === 'number' ? payload.confidence : 0.95
            touchCompanion(choice, confidence)

            // 派发到核心状态机
            await ctx.rpsluna.dispatchInput({
              roomId: payload.roomId || config.defaultRoomId,
              choice,
              confidence,
              provider: 'adapter-vision',
              timestamp: Date.now(),
              raw: payload.landmarks,
            })

            // 同步广播手势到大屏前端 HUD
            broadcastToKiosk({
              type: 'gesture_feed',
              choice,
              confidence,
              timestamp: Date.now(),
            })
          } catch (err) {
            // 忽略格式错误帧
          }
        })

        ws.on('close', () => {
          ctx.logger('rpsluna-vision').warn('📹 外部手势推流连接已关闭')
        })
        return
      }

      // 分流 B: 外部商显大屏前端 HUD 长连接 (ws://localhost:9498/stream)
      kioskClients.add(ws)
      const room = ctx.rpsluna.getOrCreateRoom(config.defaultRoomId)
      ws.send(JSON.stringify({
        type: 'init',
        room: {
          id: room.id,
          name: room.name,
          status: room.status,
          activeStrategy: room.activeStrategyName,
          stats: room.getStats(),
          history: room.history.slice(-10).reverse(),
        },
        difficulty: config.defaultDifficulty,
        skin: config.kioskSkin,
        companionOnline: isCompanionOnline,
      }))

      ws.on('close', () => {
        kioskClients.delete(ws)
      })
    })

    const broadcastToKiosk = (msg: any) => {
      const data = JSON.stringify(msg)
      for (const client of kioskClients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data)
        }
      }
    }

    // 订阅核心对决事件向大屏广播
    ctx.on('rpsluna/round-end' as any, (event: any) => {
      broadcastToKiosk({
        type: 'round_end',
        event,
        stats: ctx.rpsluna.getOrCreateRoom(config.defaultRoomId).getStats(),
      })
    })

    // 5. Fail-Fast 强依赖检查与启动
    ctx.on('ready', () => {
      if (config.defaultDifficulty === 'adaptive') {
        const required = ['markov', 'iocaine']
        const available = Array.from(ctx.rpsluna.strategies.keys())
        const missing = required.filter(name => !available.includes(name))

        if (missing.length > 0) {
          const fatalMsg =
            `❌ [rpsluna-adapter-vision] 拒绝启动 (Fail-Fast 强熔断)：你配置了智能自适应模式 (adaptive)，` +
            `但未检测到前置依赖策略插件 [${missing.join(', ')}]！\n` +
            `👉 解决办法：请确保已启用 koishi-plugin-rpsluna-strategy-markov 与 koishi-plugin-rpsluna-strategy-all，` +
            `或将 defaultDifficulty 切换为 easy / normal / hard。`
          ctx.logger('rpsluna-vision').error(fatalMsg)
          ctx.scope.dispose()
          return
        }
      }

      server.listen(config.port, config.host, () => {
        ctx.logger('rpsluna-vision').info(`🎯 视觉体感互动大屏已就绪: http://localhost:${config.port}`)
        ctx.logger('rpsluna-vision').info(`📡 YOLO11 伴侣推流管道开放: ws://localhost:${config.port}/gesture-stream`)
      })
    })

    ctx.on('dispose', () => {
      if (companionTimer) clearTimeout(companionTimer)
      for (const client of kioskClients) client.terminate()
      wss.close()
      server.close()
    })
  })
}

// 渲染现代沉浸式商显体感 Kiosk 页面 (含 HUD 镜头镜像与自适应指示)
function renderKioskHtml(config: Config): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>🎯 RPSLUNA · 视觉商显体感互动大屏 (Port 9498)</title>
  <style>
    @import "https://cdn.jsdelivr.net/npm/@free-fonts/lxgw-wenkai@1.0.1/lxgw-wenkai.css";
    :root {
      --bg: #090d16;
      --card-bg: rgba(22, 29, 47, 0.85);
      --border: #23314d;
      --primary: #38bdf8;
      --accent: #818cf8;
      --win: #4ade80;
      --lose: #f87171;
      --draw: #fbbf24;
      --text: #f1f5f9;
      --text-muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body, button, input, select {
      font-family: 'LXGW WenKai', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", sans-serif;
    }
    body {
      background: var(--bg);
      color: var(--text);
      overflow: hidden;
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    /* 顶部 HUD 仪表栏 */
    header {
      height: 68px;
      padding: 0 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      background: rgba(13, 19, 33, 0.95);
      backdrop-filter: blur(12px);
      z-index: 10;
    }
    .brand { display: flex; align-items: center; gap: 14px; }
    .brand h1 { font-size: 1.35rem; font-weight: 800; letter-spacing: 1px; color: #fff; }
    .tag { font-size: 0.72rem; padding: 3px 8px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: var(--primary); font-weight: 700; border: 1px solid rgba(56, 189, 248, 0.3); }
    .status-badge { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; padding: 6px 14px; border-radius: 20px; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #64748b; }
    .dot.green { background: var(--win); box-shadow: 0 0 10px var(--win); }

    /* 中间主体核心对战舞台 */
    main {
      flex: 1;
      display: grid;
      grid-template-columns: 320px 1fr 340px;
      padding: 24px;
      gap: 24px;
      overflow: hidden;
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(8px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    }

    /* 左侧：自适应四阶段与天梯榜 */
    .stage-card { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
    .stage-item {
      padding: 10px 12px;
      border-radius: 8px;
      background: rgba(0,0,0,0.25);
      border-left: 4px solid #334155;
      font-size: 0.82rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s;
    }
    .stage-item.active {
      border-left-color: var(--primary);
      background: rgba(56, 189, 248, 0.12);
      transform: translateX(4px);
    }
    .stage-title { font-weight: 600; }
    .stage-desc { font-size: 0.72rem; color: var(--text-muted); }

    /* 中央：主舞台与倒计时出拳对抗 */
    .stage-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }
    .vs-arena {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 20px;
    }
    .combatant {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .hand-box {
      width: 180px;
      height: 180px;
      border-radius: 24px;
      background: rgba(0,0,0,0.3);
      border: 2px dashed var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 5rem;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .hand-box.pop {
      transform: scale(1.15);
      border-style: solid;
      border-color: var(--primary);
      box-shadow: 0 0 35px rgba(56, 189, 248, 0.4);
    }
    .combat-label { font-size: 1.15rem; font-weight: 700; letter-spacing: 1px; }

    .vs-badge {
      font-size: 2.8rem;
      font-weight: 900;
      font-style: italic;
      color: rgba(255,255,255,0.2);
    }

    /* 结算横幅与嘲讽 */
    .outcome-banner {
      min-height: 80px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .outcome-text { font-size: 2rem; font-weight: 900; letter-spacing: 2px; }
    .outcome-text.win { color: var(--win); text-shadow: 0 0 20px rgba(74, 222, 128, 0.5); }
    .outcome-text.lose { color: var(--lose); text-shadow: 0 0 20px rgba(248, 113, 113, 0.5); }
    .outcome-text.draw { color: var(--draw); text-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
    .quote-bubble { font-size: 0.95rem; color: var(--text-muted); font-style: italic; }

    /* 底部快速出拳测试条 (离线兜底备用) */
    .quick-actions {
      display: flex;
      gap: 14px;
      padding: 12px 20px;
      border-radius: 40px;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--border);
    }
    .action-btn {
      padding: 10px 22px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.05);
      color: #fff;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .action-btn:hover { background: var(--primary); color: #000; transform: translateY(-2px); }

    /* 右侧：本地摄像头画中画镜像与实时推流指标 */
    .video-viewport {
      width: 100%;
      aspect-ratio: 4 / 3;
      border-radius: 10px;
      background: #000;
      border: 1px solid var(--border);
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
    }
    video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
    .camera-placeholder { color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 20px; }
    .hud-overlay {
      position: absolute;
      bottom: 8px;
      left: 8px;
      right: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 0.72rem;
      background: rgba(0,0,0,0.6);
      padding: 4px 8px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <h1>🎯 RPSLUNA 外部商显体感大屏</h1>
      <span class="tag">PORT 9498</span>
      <span class="tag">VISION STAGE</span>
    </div>
    <div style="display: flex; gap: 14px; align-items: center;">
      <button class="action-btn" style="padding: 6px 14px; font-size: 0.82rem;" onclick="toggleCamera()">📹 开启本地 HUD 镜头</button>
      <div class="status-badge">
        <div id="companionDot" class="dot"></div>
        <span id="companionText">伴侣待机中</span>
      </div>
    </div>
  </header>

  <main>
    <!-- 左侧：自适应四阶段读心指示 -->
    <div class="panel">
      <h3 style="font-size: 1rem; color: var(--primary);">🧠 认知自适应四阶段</h3>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">AI 动态心智模型升降状态</p>
      <div class="stage-card">
        <div id="stage1" class="stage-item active">
          <div><div class="stage-title">① 破冰放水期</div><div class="stage-desc">前 1~2 局建立信心</div></div>
          <span style="font-size: 1.1rem;">🌱</span>
        </div>
        <div id="stage2" class="stage-item">
          <div><div class="stage-title">② 习惯建模期</div><div class="stage-desc">第 3~4 局转移矩阵</div></div>
          <span style="font-size: 1.1rem;">📈</span>
        </div>
        <div id="stage3" class="stage-item">
          <div><div class="stage-title">③ 绝对读心期</div><div class="stage-desc">第 5 局+ 元博弈压制</div></div>
          <span style="font-size: 1.1rem;">🔥</span>
        </div>
        <div id="stage4" class="stage-item">
          <div><div class="stage-title">④ 暖心救济期</div><div class="stage-desc">连败 3 局彩蛋放水</div></div>
          <span style="font-size: 1.1rem;">🎁</span>
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border); font-size: 0.8rem; display: flex; justify-content: space-between;">
        <span>当前策略: <strong id="activeStrat" style="color: var(--primary);">自适应</strong></span>
        <span>对决局数: <strong id="totalRounds">0</strong></span>
      </div>
    </div>

    <!-- 中央：主出拳对抗舞台 -->
    <div class="panel stage-center">
      <div class="vs-arena">
        <div class="combatant">
          <div class="combat-label" style="color: var(--primary);">👤 玩家手势</div>
          <div id="playerHand" class="hand-box">❔</div>
        </div>

        <div class="vs-badge">VS</div>

        <div class="combatant">
          <div class="combat-label" style="color: var(--lose);">🤖 露娜 AI</div>
          <div id="aiHand" class="hand-box">❔</div>
        </div>
      </div>

      <div class="outcome-banner">
        <div id="outcomeText" class="outcome-text">等待手势出拳...</div>
        <div id="quoteText" class="quote-bubble">“请在镜头前伸出石头、剪刀或布”</div>
      </div>

      <div class="quick-actions">
        <button class="action-btn" onclick="sendAction('rock')">🪨 石头 (1)</button>
        <button class="action-btn" onclick="sendAction('scissors')">✂️ 剪刀 (2)</button>
        <button class="action-btn" onclick="sendAction('paper')">🖐️ 布 (3)</button>
      </div>
    </div>

    <!-- 右侧：本地摄像头画中画 HUD 与实时帧率 -->
    <div class="panel">
      <h3 style="font-size: 1rem; color: var(--primary);">📸 实时视觉镜子 HUD</h3>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">本地零延迟摄像头手部取景</p>
      
      <div class="video-viewport">
        <video id="webcam" autoplay playsinline muted style="display: none;"></video>
        <div id="camHint" class="camera-placeholder">
          <span>点击上方「开启本地 HUD 镜头」<br>或启动 Python YOLO 伴侣推流</span>
        </div>
        <div class="hud-overlay">
          <span>FPS: 60</span>
          <span id="detectedGestureText">手势: 待机</span>
        </div>
      </div>

      <div style="margin-top: 14px; font-size: 0.8rem; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">玩家胜率:</span>
          <strong id="winRate" style="color: var(--win);">0.0%</strong>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: var(--text-muted);">AI 压制率:</span>
          <strong id="aiRate" style="color: var(--lose);">0.0%</strong>
        </div>
      </div>
    </div>
  </main>

  <script>
    const EMOJIS = { rock: '🪨', scissors: '✂️', paper: '🖐️' };
    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    let ws = null;

    function connectWs() {
      ws = new WebSocket(wsProto + '//' + location.host + '/stream');
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            updateStats(data.room.stats);
          } else if (data.type === 'gesture_feed') {
            document.getElementById('detectedGestureText').innerText = '手势: ' + (EMOJIS[data.choice] || data.choice);
            setCompanionActive(true);
          } else if (data.type === 'round_end') {
            handleRoundEnd(data.event, data.stats);
          }
        } catch (e) {}
      };
      ws.onclose = () => {
        setTimeout(connectWs, 2000);
      };
    }
    connectWs();

    function setCompanionActive(active) {
      const dot = document.getElementById('companionDot');
      const text = document.getElementById('companionText');
      if (active) {
        dot.className = 'dot green';
        text.innerText = 'YOLO 伴侣推流中';
      } else {
        dot.className = 'dot';
        text.innerText = '伴侣待机中';
      }
    }

    function updateStats(stats) {
      if (!stats) return;
      document.getElementById('totalRounds').innerText = stats.total || 0;
      document.getElementById('winRate').innerText = (stats.winRate || 0) + '%';
      const aiR = stats.total > 0 ? ((stats.aiWins / stats.total) * 100).toFixed(1) : '0.0';
      document.getElementById('aiRate').innerText = aiR + '%';

      // 阶段更新
      const r = stats.total || 0;
      for (let i = 1; i <= 4; i++) document.getElementById('stage' + i).className = 'stage-item';
      if (r <= 2) document.getElementById('stage1').className = 'stage-item active';
      else if (r <= 4) document.getElementById('stage2').className = 'stage-item active';
      else document.getElementById('stage3').className = 'stage-item active';
    }

    function handleRoundEnd(event, stats) {
      const playerHand = document.getElementById('playerHand');
      const aiHand = document.getElementById('aiHand');
      const outcomeText = document.getElementById('outcomeText');
      const quoteText = document.getElementById('quoteText');

      playerHand.innerText = EMOJIS[event.playerChoice] || '❓';
      aiHand.innerText = EMOJIS[event.aiChoice] || '❓';
      playerHand.classList.add('pop');
      aiHand.classList.add('pop');
      setTimeout(() => {
        playerHand.classList.remove('pop');
        aiHand.classList.remove('pop');
      }, 500);

      outcomeText.className = 'outcome-text ' + event.outcome;
      if (event.outcome === 'win') outcomeText.innerText = '🎉 玩家获胜！';
      else if (event.outcome === 'lose') outcomeText.innerText = '💀 露娜 AI 获胜！';
      else outcomeText.innerText = '🤝 势均力敌·平局！';

      if (event.commentary) {
        quoteText.innerText = '“' + event.commentary + '”';
      }
      updateStats(stats);
    }

    async function sendAction(choice) {
      try {
        await fetch('/api/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ choice })
        });
      } catch (e) {}
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === '1') sendAction('rock');
      if (e.key === '2') sendAction('scissors');
      if (e.key === '3') sendAction('paper');
    });

    let cameraStream = null;
    async function toggleCamera() {
      const video = document.getElementById('webcam');
      const hint = document.getElementById('camHint');
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        cameraStream = null;
        video.style.display = 'none';
        hint.style.display = 'block';
      } else {
        try {
          cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
          video.srcObject = cameraStream;
          video.style.display = 'block';
          hint.style.display = 'none';
        } catch (e) {
          alert('无法启动本地摄像头: ' + e.message);
        }
      }
    }
  </script>
</body>
</html>`
}
