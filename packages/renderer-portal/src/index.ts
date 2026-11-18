import { Context, Schema } from 'koishi'
import http from 'http'
import { Choice, formatChoice, formatOutcome } from 'koishi-plugin-rpsluna-core'
import { usage } from './usage'

export const name = 'rpsluna-renderer-portal'
export { usage }

export interface Config {
  port: number
  host: string
  title: string
}

export const Config: Schema<Config> = Schema.object({
  port: Schema.union([
    Schema.natural().max(65535),
    Schema.transform(Schema.string(), (v) => {
      const n = parseInt(v, 10)
      if (isNaN(n) || n < 0 || n > 65535) throw new Error('端口必须是 0-65535 之间的整数')
      return n
    }),
  ]).default(8498).description('公网玩家独立访问端口 (用于 FRP 穿透，与 Koishi 控制台物理隔离)'),
  host: Schema.string().default('0.0.0.0').description('监听的主机地址 (0.0.0.0 表示允许所有外网 IP 访问)'),
  title: Schema.string().default('rpsluna 竞技场').description('网页标题'),
})

export function apply(ctx: Context, config: Config) {
  ctx.inject(['rpsluna'], (ctx) => {
    const server = http.createServer((req, res) => {
      // 允许跨域
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        return res.end()
      }

      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

      // 1. 获取当前状态 API
      if (url.pathname === '/api/state') {
        const roomId = url.searchParams.get('room') || 'default'
        const room = ctx.rpsluna.getOrCreateRoom(roomId)
        const stats = room.getStats()
        const strategies = Array.from(ctx.rpsluna.strategies.values()).map((s) => ({
          name: s.name,
          displayName: s.displayName || s.name,
          description: s.description || '',
        }))
        const adapters = Array.from(ctx.rpsluna.adapters.values()).map((a) => ({
          name: a.name,
          displayName: a.displayName || a.name,
          description: a.description || '',
        }))

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
        return res.end(
          JSON.stringify({
            room: {
              id: room.id,
              name: room.name,
              mode: room.mode,
              status: room.status,
              activeStrategy: room.activeStrategyName,
              countdownRemaining: room.countdownRemaining,
            },
            stats,
            history: room.history.slice(-15).reverse(),
            strategies,
            adapters,
          })
        )
      }

      // 2. 玩家出拳操作 API
      if (url.pathname === '/api/action' && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}')
            const roomId = data.room || 'default'
            const choice = data.choice as Choice
            if (!['rock', 'paper', 'scissors'].includes(choice)) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              return res.end(JSON.stringify({ error: '无效出拳' }))
            }

            const record = await ctx.rpsluna.dispatchInput({
              roomId,
              choice,
              confidence: 1.0,
              provider: 'portal-web',
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

      // 3. 房间配置修改 API
      if (url.pathname === '/api/config' && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}')
            const roomId = data.room || 'default'
            const room = ctx.rpsluna.getOrCreateRoom(roomId)
            if (data.mode && ['countdown', 'flow'].includes(data.mode)) {
              room.mode = data.mode
            }
            if (data.strategy && ctx.rpsluna.strategies.has(data.strategy)) {
              room.activeStrategyName = data.strategy
            }
            if (data.resetHistory) {
              room.clearHistory()
            }
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
            return res.end(JSON.stringify({ success: true }))
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ error: err.message }))
          }
        })
        return
      }

      // 4. 触发倒计时 API
      if (url.pathname === '/api/countdown' && req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          const data = JSON.parse(body || '{}')
          const roomId = data.room || 'default'
          const room = ctx.rpsluna.getOrCreateRoom(roomId)
          room.startCountdown()
          res.writeHead(200, { 'Content-Type': 'application/json' })
          return res.end(JSON.stringify({ success: true }))
        })
        return
      }

      // 5. 静态单页应用 SPA
      if (url.pathname === '/' || url.pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
        return res.end(renderPortalHtml(config.title))
      }

      res.writeHead(404)
      res.end('Not Found')
    })

    server.listen(config.port, config.host, () => {
      ctx.logger('rpsluna').info(
        `🌐 rpsluna 公网独立对战 Portal 已启动: http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${config.port}`
      )
    })

    ctx.on('dispose', () => {
      server.close()
    })
  })
}

function renderPortalHtml(title: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - RPS 赛博博弈竞技场</title>
  <style>
    @import "https://cdn.jsdelivr.net/npm/@free-fonts/lxgw-wenkai@1.0.1/lxgw-wenkai.css";
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --accent: #38bdf8;
      --text: #f8fafc;
      --text-dim: #94a3b8;
      --win: #4ade80;
      --lose: #f87171;
      --draw: #fbbf24;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'LXGW WenKai', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.5rem;
    }
    .container {
      width: 100%;
      max-width: 860px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    header h1 {
      font-size: 1.5rem;
      color: var(--accent);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .badge {
      font-size: 0.75rem;
      background: rgba(56, 189, 248, 0.15);
      color: var(--accent);
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      border: 1px solid var(--accent);
    }
    .control-panel {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
    }
    .control-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }
    select, button {
      background: #0f172a;
      color: var(--text);
      border: 1px solid var(--border);
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      outline: none;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    select:hover, button:hover {
      border-color: var(--accent);
    }
    .arena-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 2rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .vs-grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      text-align: center;
      margin-bottom: 2rem;
    }
    .combatant {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }
    .avatar-icon {
      font-size: 4rem;
      height: 6rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s;
    }
    .vs-badge {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-dim);
      background: #0f172a;
      padding: 0.5rem 1rem;
      border-radius: 50%;
      border: 1px solid var(--border);
    }
    .countdown-display {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 6rem;
      font-weight: 900;
      color: var(--accent);
      text-shadow: 0 0 30px rgba(56, 189, 248, 0.6);
      pointer-events: none;
      display: none;
    }
    .commentary-bubble {
      width: 100%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px dashed var(--accent);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.5rem;
      font-size: 0.9rem;
      color: #38bdf8;
      text-align: center;
      min-height: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .buttons-row {
      display: flex;
      gap: 1rem;
      width: 100%;
      max-width: 480px;
    }
    .btn-action {
      flex: 1;
      padding: 1rem 0.5rem;
      background: #0f172a;
      border: 2px solid var(--border);
      border-radius: 12px;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-action:hover {
      border-color: var(--accent);
      background: rgba(56, 189, 248, 0.1);
      transform: translateY(-2px);
    }
    .stats-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      text-align: center;
      gap: 1rem;
    }
    .stat-val {
      font-size: 1.6rem;
      font-weight: 700;
    }
    .stat-label {
      font-size: 0.8rem;
      color: var(--text-dim);
    }
    .history-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }
    .history-title {
      font-size: 1rem;
      margin-bottom: 0.75rem;
      color: var(--text-dim);
    }
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 220px;
      overflow-y: auto;
    }
    .history-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0.75rem;
      background: #0f172a;
      border-radius: 6px;
      font-size: 0.85rem;
    }
    .outcome-win { color: var(--win); font-weight: bold; }
    .outcome-lose { color: var(--lose); font-weight: bold; }
    .outcome-draw { color: var(--draw); font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1><span>🎮</span> rpsluna RPS 赛博博弈竞技场</h1>
    </header>

    <div class="control-panel">
      <div class="control-group">
        <label>博弈策略：</label>
        <select id="strategy-select" onchange="updateConfig()"></select>
      </div>
      <div class="control-group">
        <label>节奏模式：</label>
        <select id="mode-select" onchange="updateConfig()">
          <option value="countdown">回合倒计时制 (3, 2, 1)</option>
          <option value="flow">连续流式对决 (持续手势)</option>
        </select>
      </div>
      <button onclick="resetStats()">清空战绩</button>
    </div>

    <div class="arena-card">
      <div id="countdown-overlay" class="countdown-display">3</div>
      <div class="vs-grid">
        <div class="combatant">
          <div class="avatar-icon" id="player-icon">❓</div>
          <div style="font-weight: 600;">人类玩家</div>
        </div>
        <div class="vs-badge" id="result-badge">VS</div>
        <div class="combatant">
          <div class="avatar-icon" id="ai-icon">🤖</div>
          <div style="font-weight: 600;" id="ai-name">AI 对手</div>
        </div>
      </div>

      <div class="commentary-bubble" id="commentary-box">
        💡 准备就绪，点击下方按钮或让摄像头/投屏窗口识别手势出拳！
      </div>

      <div class="buttons-row">
        <button class="btn-action" onclick="play('rock')"><span>✊</span><span>石头</span></button>
        <button class="btn-action" onclick="play('scissors')"><span>✌️</span><span>剪刀</span></button>
        <button class="btn-action" onclick="play('paper')"><span>🖐️</span><span>布</span></button>
      </div>
    </div>

    <div class="stats-card">
      <div>
        <div class="stat-val" id="stat-total" style="color: var(--accent);">0</div>
        <div class="stat-label">总局数</div>
      </div>
      <div>
        <div class="stat-val" id="stat-win" style="color: var(--win);">0</div>
        <div class="stat-label">玩家胜利</div>
      </div>
      <div>
        <div class="stat-val" id="stat-lose" style="color: var(--lose);">0</div>
        <div class="stat-label">AI 胜利</div>
      </div>
      <div>
        <div class="stat-val" id="stat-rate">0.0%</div>
        <div class="stat-label">玩家胜率</div>
      </div>
    </div>

    <div class="history-card">
      <div class="history-title">最近对局记录</div>
      <div class="history-list" id="history-container"></div>
    </div>
  </div>

  <script>
    const choiceIcons = { rock: '✊', paper: '🖐️', scissors: '✌️' };
    let currentRoom = 'default';
    let isCounting = false;

    async function loadState() {
      try {
        const res = await fetch('/api/state?room=' + currentRoom);
        const data = await res.body ? await res.json() : {};
        if (!data || !data.room) return;

        // 更新策略下拉框
        const select = document.getElementById('strategy-select');
        if (select.children.length === 0 && data.strategies) {
          select.innerHTML = data.strategies.map(s => 
            \`<option value="\${s.name}" \${s.name === data.room.activeStrategy ? 'selected' : ''}>\${s.displayName}</option>\`
          ).join('');
        }
        document.getElementById('mode-select').value = data.room.mode;

        // 更新战绩
        document.getElementById('stat-total').innerText = data.stats.total;
        document.getElementById('stat-win').innerText = data.stats.playerWins;
        document.getElementById('stat-lose').innerText = data.stats.aiWins;
        document.getElementById('stat-rate').innerText = (data.stats.winRate * 100).toFixed(1) + '%';

        // 渲染历史记录
        const histContainer = document.getElementById('history-container');
        histContainer.innerHTML = data.history.map(h => {
          const outcomeClass = h.outcome === 'win' ? 'outcome-win' : (h.outcome === 'lose' ? 'outcome-lose' : 'outcome-draw');
          const outcomeText = h.outcome === 'win' ? '胜' : (h.outcome === 'lose' ? '负' : '平');
          return \`
            <div class="history-item" style="flex-direction: column; align-items: stretch; gap: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>第 #\${h.id} 局 (\${h.inputProvider})</span>
                <span>玩家 \${choiceIcons[h.playerChoice]} vs AI \${choiceIcons[h.aiChoice]}</span>
                <span class="\${outcomeClass}">\${outcomeText}</span>
              </div>
              \${h.commentary ? \`<div style="font-size: 0.82rem; color: #a5b4fc; font-style: italic;">💬 \${h.commentary}</div>\` : ''}
            </div>
          \`;
        }).join('');

        // 如果最新一条记录有评委台词
        if (data.history.length > 0 && data.history[0].commentary) {
          document.getElementById('commentary-box').innerText = '💬 ' + data.history[0].commentary;
        }
      } catch (err) {}
    }

    async function play(choice) {
      const mode = document.getElementById('mode-select').value;
      if (mode === 'countdown' && !isCounting) {
        // 倒数 3, 2, 1 动画
        isCounting = true;
        const overlay = document.getElementById('countdown-overlay');
        overlay.style.display = 'block';
        for (let i = 3; i >= 1; i--) {
          overlay.innerText = i;
          await new Promise(r => setTimeout(r, 600));
        }
        overlay.style.display = 'none';
        isCounting = false;
      }

      document.getElementById('player-icon').innerText = choiceIcons[choice];
      const res = await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: currentRoom, choice })
      });
      const data = await res.json();
      if (data.record) {
        document.getElementById('ai-icon').innerText = choiceIcons[data.record.aiChoice];
        const resultBadge = document.getElementById('result-badge');
        if (data.record.outcome === 'win') {
          resultBadge.innerText = 'WIN 🎉';
          resultBadge.style.color = 'var(--win)';
        } else if (data.record.outcome === 'lose') {
          resultBadge.innerText = 'LOSE 🤖';
          resultBadge.style.color = 'var(--lose)';
        } else {
          resultBadge.innerText = 'DRAW 🤝';
          resultBadge.style.color = 'var(--draw)';
        }

        if (data.record.commentary) {
          const commentaryBox = document.getElementById('commentary-box');
          commentaryBox.innerText = '💬 ' + data.record.commentary;
        }
      }
      loadState();
    }

    async function updateConfig() {
      const strategy = document.getElementById('strategy-select').value;
      const mode = document.getElementById('mode-select').value;
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: currentRoom, strategy, mode })
      });
      loadState();
    }

    async function resetStats() {
      if (!confirm('确认清空对局记录与历史统计？')) return;
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: currentRoom, resetHistory: true })
      });
      loadState();
    }

    setInterval(loadState, 2000);
    loadState();
  </script>
</body>
</html>`;
}
