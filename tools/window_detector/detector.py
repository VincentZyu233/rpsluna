"""
rpsluna Window Gesture Detector (YOLO 极速轻量端到端版)
功能：
1. --list: 毫秒级列出当前桌面所有可见窗口标题、所属进程与尺寸
2. 捕获指定窗口（如 RustDesk 投屏窗口）或屏幕指定区域
3. YOLO 深度神经网络目标检测：精准定位手部并分类石头 (Rock)、剪刀 (Scissors)、布 (Paper)
4. 支持 --proxy 参数：灵活配置模型下载代理 (如 --proxy http://127.0.0.1:7890)
5. 通过 WebSocket 实时推送至 Koishi 插件 (ws://localhost:18082/gesture-stream)
"""

import os
import sys
import ctypes
from ctypes import wintypes
import urllib.request
import pygetwindow as gw

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
MODEL_FILENAME = "yolo_rps.onnx"
MODEL_PATH = os.path.join(MODEL_DIR, MODEL_FILENAME)
MODEL_URL = "https://raw.githubusercontent.com/alihassanml/Rcok-Seassor-Paper-Predict-Yolo11/main/best.onnx"

CLASSES = ["paper", "rock", "scissors"]
CLASS_CN = {"rock": "✊ 石头", "paper": "🖐️ 布", "scissors": "✌️ 剪刀"}

def get_process_name_by_hwnd(hwnd: int) -> str:
    """根据窗口句柄获取进程可执行文件名 (如 Code.exe, RustDesk.exe)"""
    if not hwnd:
        return "unknown"
    pid = wintypes.DWORD()
    ctypes.windll.user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    if not pid.value:
        return "unknown"
    
    # 0x1000: PROCESS_QUERY_LIMITED_INFORMATION
    h_proc = ctypes.windll.kernel32.OpenProcess(0x1000, False, pid.value)
    if not h_proc:
        return f"pid:{pid.value}"
    
    buf = ctypes.create_unicode_buffer(1024)
    size = wintypes.DWORD(1024)
    name = f"pid:{pid.value}"
    if ctypes.windll.kernel32.QueryFullProcessImageNameW(h_proc, 0, buf, ctypes.byref(size)):
        name = os.path.basename(buf.value)
    ctypes.windll.kernel32.CloseHandle(h_proc)
    return name

def list_all_windows():
    """列出当前桌面所有可见窗口标题、所属进程与尺寸"""
    windows = gw.getAllWindows()
    visible = []
    for w in windows:
        title = w.title.strip()
        if title and w.width > 50 and w.height > 50:
            exe_name = get_process_name_by_hwnd(getattr(w, '_hWnd', 0))
            visible.append((w, exe_name))
    
    visible.sort(key=lambda item: item[0].title.lower())
    print("==================================================")
    print(f"📋 当前桌面可见窗口列表 (共 {len(visible)} 个):")
    print("==================================================")
    for idx, (w, exe) in enumerate(visible, 1):
        print(f"[{idx:02d}] \"{w.title}\"\n     └─ 进程: {exe} | 分辨率: {w.width}x{w.height} | 坐标: ({w.left}, {w.top})")
    print("==================================================")
    print("💡 可以直接传窗口序号（如 2）、窗口标题关键字或进程名（如 iqoo 或 rustdesk.exe）:")
    print("   uv run detector.py 2")
    print("   uv run detector.py \"某个窗口名称\"")
    print("==================================================")

# 遇到 --list 或 -l 参数，立即秒级列出并退出
if "--list" in sys.argv or "-l" in sys.argv:
    list_all_windows()
    sys.exit(0)

import time
import json
import asyncio
import numpy as np
import cv2
import mss
import websockets

def ensure_yolo_model(proxy_url: str | None = None) -> str:
    """确保 YOLO ONNX 模型文件存在，不存在则自动按需下载 (支持代理)"""
    os.makedirs(MODEL_DIR, exist_ok=True)
    if os.path.exists(MODEL_PATH) and os.path.getsize(MODEL_PATH) > 5000000:
        return MODEL_PATH

    print("==================================================")
    print(f"📥 正在下载 YOLO 轻量手势检测模型 ({MODEL_FILENAME}, ~10MB)...")
    
    handlers = []
    if proxy_url:
        print(f"🌐 正在使用配置的代理下载: {proxy_url}")
        handlers.append(urllib.request.ProxyHandler({'http': proxy_url, 'https': proxy_url}))
    elif os.environ.get("HTTP_PROXY") or os.environ.get("HTTPS_PROXY"):
        env_proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("HTTP_PROXY")
        print(f"🌐 自动检测到系统环境变量代理: {env_proxy}")
        handlers.append(urllib.request.ProxyHandler({'http': env_proxy, 'https': env_proxy}))
    
    opener = urllib.request.build_opener(*handlers)
    req = urllib.request.Request(MODEL_URL, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with opener.open(req, timeout=30) as resp, open(MODEL_PATH, 'wb') as f:
            total_size = int(resp.headers.get('Content-Length', 0))
            downloaded = 0
            while True:
                chunk = resp.read(1024 * 64)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    pct = (downloaded / total_size) * 100
                    print(f"\r progress: {pct:.1f}% ({downloaded // 1024} KB / {total_size // 1024} KB)", end="")
        print("\n✅ YOLO 模型下载完成！")
        return MODEL_PATH
    except Exception as e:
        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)
        print(f"\n❌ 模型下载失败: {e}")
        print("💡 建议使用 --proxy 参数指定代理下载，例如:")
        print("   uv run detector.py iqoo --proxy http://127.0.0.1:7890")
        sys.exit(1)

def letterbox(im, new_shape=(640, 640), color=(114, 114, 114)):
    """保持图像长宽比将图像缩放到 640x640，四周填充灰边"""
    shape = im.shape[:2] # [h, w]
    r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
    new_unpad = int(round(shape[1] * r)), int(round(shape[0] * r))
    dw, dh = (new_shape[1] - new_unpad[0]) / 2, (new_shape[0] - new_unpad[1]) / 2
    if shape[::-1] != new_unpad:
        im = cv2.resize(im, new_unpad, interpolation=cv2.INTER_LINEAR)
    top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
    left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
    im = cv2.copyMakeBorder(im, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
    return im, r, (dw, dh)

def detect_yolo(net, frame, conf_thresh=0.35, nms_thresh=0.40):
    """
    使用 OpenCV DNN 引擎执行 YOLO 推理并返回最高置信度的出拳分类与检测框
    """
    h, w = frame.shape[:2]
    img, r, (dw, dh) = letterbox(frame)
    blob = cv2.dnn.blobFromImage(img, 1 / 255.0, (640, 640), swapRB=True, crop=False)
    net.setInput(blob)
    preds = net.forward() # shape: (1, 7, 8400)
    preds = np.transpose(preds[0], (1, 0)) # shape: (8400, 7)

    boxes = []
    confidences = []
    class_ids = []

    for row in preds:
        classes_scores = row[4:]
        class_id = int(np.argmax(classes_scores))
        conf = float(classes_scores[class_id])
        if conf > conf_thresh:
            cx, cy, bw, bh = row[0], row[1], row[2], row[3]
            x = int((cx - dw - bw / 2) / r)
            y = int((cy - dh - bh / 2) / r)
            width = int(bw / r)
            height = int(bh / r)
            boxes.append([x, y, width, height])
            confidences.append(conf)
            class_ids.append(class_id)

    indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_thresh, nms_thresh)
    if len(indices) > 0:
        idx = int(indices[0]) if isinstance(indices[0], (int, np.integer)) else int(indices[0][0])
        return CLASSES[class_ids[idx]], confidences[idx], boxes[idx]

    return "none", 0.0, None

async def main():
    # 参数解析
    proxy_url = None
    if "--proxy" in sys.argv:
        p_idx = sys.argv.index("--proxy")
        if p_idx + 1 < len(sys.argv):
            proxy_url = sys.argv[p_idx + 1]

    args = [arg for arg in sys.argv[1:] if not arg.startswith("--") and not arg.startswith("-")]
    # 如果 --proxy 后面跟了参数，排除它
    if proxy_url and proxy_url in args:
        args.remove(proxy_url)

    target_arg = args[0] if args else "iqoo"
    ws_url = "ws://127.0.0.1:18082/gesture-stream"
    show_preview = "--no-gui" not in sys.argv

    print(f"==================================================")
    print(f"🎮 rpsluna Window Detector (YOLO 极速端到端版) 启动中...")
    print(f"🎯 目标捕获窗口: [{target_arg}] (支持窗口序号、标题关键字或进程名)")
    if proxy_url:
        print(f"🌐 代理设置: [{proxy_url}]")
    print(f"📡 目标推流 WebSocket: [{ws_url}]")
    print(f"🖥️ 预览窗口: {'开启 (按 Q 键退出)' if show_preview else '关闭'}")
    print(f"==================================================")

    # 确保并加载 YOLO ONNX 模型
    model_path = ensure_yolo_model(proxy_url)
    print("🧠 正在初始化 OpenCV DNN 神经网络加速引擎...")
    net = cv2.dnn.readNetFromONNX(model_path)
    # 启用多线程 CPU 推理
    net.setPreferableBackend(cv2.dnn.DNN_BACKEND_OPENCV)
    net.setPreferableTarget(cv2.dnn.DNN_TARGET_CPU)
    print("✅ YOLO 神经网络引擎已就绪！")

    sct = mss.MSS()
    ws = None
    last_sent_choice = None
    last_sent_time = 0
    last_warn_time = 0
    last_ws_try_time = 0

    window_name = "rpsluna Vision Detector - YOLO (Press Q to quit)"

    if show_preview:
        cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
        try:
            primary = sct.monitors[1]
            screen_w = primary.get("width", 1920)
            screen_h = primary.get("height", 1080)
            init_w, init_h = 480, 720
            cv2.resizeWindow(window_name, init_w, init_h)
            pos_x = max(100, (screen_w - init_w) // 2)
            pos_y = max(80, (screen_h - init_h) // 2)
            cv2.moveWindow(window_name, pos_x, pos_y)
        except Exception:
            pass

    while True:
        now = time.time()

        # 维持与 Koishi 插件的推流连接 (每 3 秒尝试一次，非阻塞主循环)
        if ws is None and (now - last_ws_try_time > 3.0):
            last_ws_try_time = now
            try:
                ws = await asyncio.wait_for(websockets.connect(ws_url), timeout=0.3)
                print("✅ 成功连接到 Koishi adapter-window 推流服务！")
            except Exception:
                ws = None

        # 查找目标窗口：支持序号（如 "2"）、标题关键字（如 "iqoo"）或进程名（如 "rustdesk.exe"）
        all_windows = [w for w in gw.getAllWindows() if w.title.strip() and w.width > 50 and w.height > 50]
        all_windows.sort(key=lambda w: w.title.lower())

        target_win = None
        if target_arg.isdigit():
            idx = int(target_arg) - 1
            if 0 <= idx < len(all_windows):
                target_win = all_windows[idx]
        else:
            t_lower = target_arg.lower()
            for w in all_windows:
                if t_lower in w.title.lower():
                    target_win = w
                    break
                exe = get_process_name_by_hwnd(getattr(w, '_hWnd', 0)).lower()
                if t_lower in exe:
                    target_win = w
                    break

        # 窗口未找到或被最小化处理
        if target_win is None or target_win.isMinimized or target_win.left <= -10000:
            if now - last_warn_time > 2.0:
                print(f"⏳ 正在等待目标窗口 [{target_arg}] 出现且未被最小化...")
                last_warn_time = now

            if show_preview:
                blank = np.zeros((300, 600, 3), dtype=np.uint8)
                cv2.putText(
                    blank,
                    f"Waiting for window: [{target_arg}]",
                    (30, 100),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.8,
                    (0, 165, 255),
                    2
                )
                cv2.putText(
                    blank,
                    "Make sure window is NOT minimized!",
                    (30, 160),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (200, 200, 200),
                    1
                )
                cv2.imshow(window_name, blank)
                if cv2.waitKey(100) & 0xFF == ord('q'):
                    break
            else:
                await asyncio.sleep(0.5)
            continue

        # 获取真实窗口边界并截取
        monitor = {
            "top": max(0, target_win.top),
            "left": max(0, target_win.left),
            "width": target_win.width,
            "height": target_win.height
        }

        try:
            screenshot = sct.grab(monitor)
            frame = np.array(screenshot)
            frame = cv2.cvtColor(frame, cv2.COLOR_BGRA2BGR)
        except Exception:
            await asyncio.sleep(0.1)
            continue

        # 执行 YOLO 目标检测 (单次推理仅需 3~5ms)
        detected_choice, confidence, box = detect_yolo(net, frame, conf_thresh=0.35, nms_thresh=0.40)

        # 标注预览
        if show_preview:
            if box is not None:
                bx, by, bw, bh = box
                color = (0, 255, 0)
                # 画出目标手势边界框
                cv2.rectangle(frame, (bx, by), (bx + bw, by + bh), color, 3)
                label = f"{detected_choice.upper()} {confidence*100:.1f}%"
                cv2.rectangle(frame, (bx, max(0, by - 30)), (bx + len(label) * 14 + 10, by), color, -1)
                cv2.putText(frame, label, (bx + 5, by - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 0, 0), 2)

            # 顶部信息栏
            top_color = (0, 255, 0) if detected_choice in ["rock", "paper", "scissors"] else (0, 165, 255)
            display_text = f"YOLO: {detected_choice.upper()} ({confidence*100:.0f}%)" if detected_choice != "none" else "YOLO: Scanning Hand..."
            cv2.putText(
                frame,
                display_text,
                (20, 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                1.0,
                top_color,
                2
            )
            cv2.putText(
                frame,
                f"Target: {target_win.title[:25]}",
                (20, 80),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 255, 255),
                1
            )
            cv2.imshow(window_name, frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

        # 推送给 Koishi (带防抖频控)
        if detected_choice in ["rock", "paper", "scissors"] and ws is not None:
            if detected_choice != last_sent_choice or (now - last_sent_time > 0.3):
                payload = {
                    "choice": detected_choice,
                    "confidence": confidence,
                    "timestamp": int(now * 1000)
                }
                try:
                    await ws.send(json.dumps(payload))
                    last_sent_choice = detected_choice
                    last_sent_time = now
                except Exception:
                    ws = None

        await asyncio.sleep(0.01) # 约 100 FPS 高刷新

    if ws:
        try:
            await ws.close()
        except Exception:
            pass
    cv2.destroyAllWindows()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        print("\n👋 rpsluna 伴侣进程已安全优雅退出。")
    except Exception as e:
        print(f"\n❌ 进程异常退出: {e}")
    finally:
        try:
            cv2.destroyAllWindows()
        except Exception:
            pass
