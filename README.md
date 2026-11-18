# 🎮 rpsluna

基于 Koishi 微内核架构、多模态视觉手势识别、多阶博弈论与 LLM 心理战的石头剪刀布交互生态平台。

---

## 🌟 核心特色

1. **四维输入解耦**：
   - 📹 **窗口捕获 (`adapter-window`)**：支持 Python MediaPipe 高帧率窗口手势推流（专为 RustDesk / 手机投屏定制），同时提供轻量 Node 内置截屏。
   - 🌐 **公网安全 Portal (`renderer-portal`)**：独立端口 (8498) 现代赛博 Web 对战页，与 Koishi 控制台物理隔离，方便 FRP 穿透给外部玩家/评委。
   - ⌨️ **按键与调试 (`adapter-buttons`)**：纯按键与 UI 兜底输入，断网或无光照也能稳定演示。
   - 💬 **聊天指令 (`adapter-command`)**：多平台 Bot 指令 `/rps 石头` 即刻开战。
2. **多阶可插拔博弈策略**：
   - 📊 **马尔可夫转移 (`strategy-markov`)**：N 阶状态转移矩阵，统计人类“赢留输变”惯性。
   - ♟️ **Iocaine Powder (`strategy-all`)**：1999 年经典国际博弈大赛冠军算法，多层假设元推理。
   - 🧠 **LLM 心理战 (`strategy-llm`)**：接入 NewAPI / OpenAI 格式接口，输出对手出拳预判与毒舌/中二心理嘲讽台词。
   - ⚡ **微秒读心外挂 (`cheat`)**：视觉毫秒时间差强行克制（娱乐彩蛋）。
3. **并发多房间与双节奏引擎**：
   - 支持多用户/多场景并发隔离房间；
   - 支持 **“回合倒计时制 (3, 2, 1)”** 与 **“连续流式对决 (Continuous Flow)”** 动态切换。

---

## 📦 模块组成

- `packages/core`: 核心对战调度器、并发房间管理、胜负判定服务。
- `packages/adapter-satori-command`: Satori 跨平台聊天指令与交互按钮适配器 (支持 QQ / Telegram / Discord 等原生按钮与文字指令)。
- `packages/adapter-window`: 外部视觉手势流 WebSocket / HTTP 接收网关。
- `packages/adapter-buttons`: 纯按键与调试输入源。
- `packages/strategy-markov`: 马尔可夫博弈策略。
- `packages/strategy-all`: 包含 Random、Iocaine Powder 与 Cheat 经典策略。
- `packages/strategy-llm`: NewAPI 大模型心理战策略。
- `packages/renderer-portal`: 独立端口 (8498) Web 对战大屏（适合 FRP 穿透）。
- `packages/renderer-console`: Koishi 控制台数据监控扩展。
- `tools/window_detector`: 基于 `uv` 的 Python 高精度手势检测伴侣脚本。

---

## 🚀 快速上手与本地调试

### 1. 关联到 Koishi 宿主环境

你可以根据操作系统选择以下任意一种方式将 `rpsluna` 挂载到 Koishi 实例：

#### 方案 A：跨平台通用一行命令 (Node.js，Windows / Linux / macOS 通用)
在 `rpsluna` 目录下直接执行（借用宿主已有的 Node.js 环境，全平台自适应符号链接/Junction）：
```bash
node -e "const fs=require('fs'),path=require('path');const ext='../koishi-ywl-rps/external';fs.mkdirSync(ext,{recursive:true});try{fs.symlinkSync(path.resolve('.'),path.join(ext,'rpsluna'),'junction')}catch(e){if(e.code!=='EEXIST')throw e;};console.log('✅ rpsluna 已成功挂载到 external 工作区！')"
```

#### 方案 B：Linux / macOS (Bash / Zsh 原生软链接)
```bash
mkdir -p ../koishi-ywl-rps/external && ln -sf "$(pwd)" ../koishi-ywl-rps/external/rpsluna
```

#### 方案 C：Windows (PowerShell 原生目录联接)
```powershell
New-Item -ItemType Directory -Path "..\koishi-ywl-rps\external" -Force | Out-Null
New-Item -ItemType Junction -Path "..\koishi-ywl-rps\external\rpsluna" -Target "$PWD"
```

#### 方案 D：零软链接方案 (直接修改宿主配置)
若不想在文件系统中创建软链接，可直接在 `koishi-ywl-rps/package.json` 的 `workspaces` 数组中添加相对路径：
```json
"workspaces": [
  "../rpsluna/packages/*"
]
```
> [!NOTE] 目录同级要求
> 此方案生效的前提是 **`koishi-ywl-rps` 与 `rpsluna` 必须处于同级目录**（如当前都在 `D:\TMP\ywl-rps\` 下，即 `../rpsluna`）。若在你的环境下两者的相对目录层级不同，请相应调整该相对路径或直接填写绝对路径。

添加后在 `koishi-ywl-rps` 目录执行 `yarn` 即可。

### 2. 运行 Python 窗口捕获伴侣 (可选)

如果使用手机投屏软件（如 RustDesk 投屏或 scrcpy）：

```powershell
cd tools/window_detector

# 第一步：先列出当前桌面所有可见窗口标题 (毫秒级返回)
uv run detector.py --list
```

> [!TIP] 实战示例：精准捕获 RustDesk 手机画面
> 执行 `--list` 后会列出当前桌面的所有窗口，例如：
> ```text
> 📋 当前桌面可见窗口列表 (共 8 个):
> [01] "D的tmp目录捏" (1936x1048 @ -8,-8)
> [02] "iqoo12安卓机@vivo-V2307A - Remote Desktop - RustDesk" (463x942 @ 46,40)
> [03] "QQ" (1936x1048 @ -8,-8)
> [04] "RustDesk" (1197x920 @ 211,119)
> ```
> 可以看到 `[04] "RustDesk"` 是控制面板主窗口，而 `[02] "iqoo12安卓机@vivo-V2307A - Remote Desktop - RustDesk"` 才是真正的手机投屏画面。
> 此时直接提取手机特征关键字即可精准锁定投屏窗口：
> ```powershell
> # 第二步：精准捕获手机竖屏画面推流 (带 YOLO 实时目标检测框预览)
> uv run detector.py iqoo12
> 
> # 如需走代理下载模型，加上 --proxy 参数
> uv run detector.py iqoo12 --proxy http://127.0.0.1:7890
> 
> # 或后台静默模式运行 (性能极速 100 FPS)
> uv run detector.py iqoo12 --no-gui
> ```

### 3. 访问 Web 竞技大屏
启动 Koishi 后：
- **公网 Portal**：浏览器访问 `http://localhost:8498`（支持 FRP 穿透公网）；
- **Koishi 管理后台**：浏览器访问 `http://localhost:51498` (514 生日 + 498 RPS 彩蛋端口)。
