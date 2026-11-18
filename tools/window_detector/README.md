# 📹 rpsluna Window Detector (YOLO 极速轻量视觉伴侣)

本模块使用 `uv` 驱动，利用轻量级 YOLO 深度神经网络与 OpenCV DNN 引擎对指定窗口（如手机投屏至电脑的 RustDesk 窗口）进行高达 100 FPS 的极速目标检测，并将识别到的石头剪刀布实时推流到 Koishi 的 `adapter-window` 插件。

---

## 🚀 极速一键启动

在当前目录下（或根目录下指定目录）：

```powershell
# 0. 先列出当前桌面的所有可用窗口标题、进程与尺寸 (方便复制名字传参)
uv run detector.py --list

# 1. 抓取手机投屏画面推流 (支持窗口序号、标题关键字或进程名)
uv run detector.py iqoo

# 2. 首次运行如需走代理下载 YOLO ONNX 模型 (~10MB)，加上 --proxy 参数
uv run detector.py iqoo --proxy http://127.0.0.1:7890

# 3. 如果不需要 OpenCV 预览窗口（纯后台静默运行，性能极致）
uv run detector.py iqoo --no-gui
```

`uv` 会自动管理轻量 Python 依赖（OpenCV、mss、pygetwindow、websockets），零手动配置环境。

---

## 📡 识别与推流协议

- **目标端点**：`ws://127.0.0.1:18082/gesture-stream`
- **推送数据格式**：
  ```json
  {
    "choice": "rock",       // "rock" | "paper" | "scissors"
    "confidence": 0.95,     // 置信度
    "timestamp": 1731750000000
  }
  ```
- **识别规则**：
  - `rock` (石头)：五指收拢握拳
  - `scissors` (剪刀)：食指、中指伸展，无名指、小指收拢
  - `paper` (布)：四指或五指均伸展
