import sys
import time
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')

WORKSPACE_ROOT = Path("d:/Projects/study-web").resolve()
RECORD_DIR = WORKSPACE_ROOT / "docs/assets"
RECORD_DIR.mkdir(parents=True, exist_ok=True)
FFMPEG_BIN = r"C:\Users\KhanhDuy\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"

print("Step 1: Launch Playwright & Authenticate...")
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="msedge",
        headless=True,
        args=["--disable-gpu", "--no-sandbox"]
    )
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        record_video_dir=str(RECORD_DIR),
        record_video_size={"width": 1280, "height": 720}
    )
    page = context.new_page()
    
    # 1. Login
    page.goto("http://localhost:5180/login")
    page.wait_for_selector('#phoneOrEmail')
    page.fill('#phoneOrEmail', "nguyenkhanhduy270304@gmail.com")
    page.fill('#password', "Password123!")
    page.get_by_role("button", name="Sign In", exact=True).click()
    page.wait_for_url("http://localhost:5180/")
    
    # Set localStorage flag so first-visit banner doesn't obstruct editor
    page.evaluate("localStorage.setItem('study_sql_first_visit_dismissed', 'true')")
    
    # 2. Go to lab
    page.goto("http://localhost:5180/labs/sql-01-select")
    page.wait_for_selector('.monaco-editor')
    
    # 3. Wait for Run Query to be enabled
    print("Waiting for PGlite Web Worker to be ready...")
    for _ in range(30):
        if not page.get_by_role("button", name="Run Query").is_disabled():
            break
        page.wait_for_timeout(500)
    
    # Mark reference timestamp for FFmpeg trimming
    t_start = time.time()
    print("Starting interaction recording sequence...")
    
    # Pause 500ms so frame 0 displays clean workspace with starter code
    page.wait_for_timeout(500)
    
    # Type solution into Monaco editor
    page.click('.monaco-editor .view-lines')
    page.keyboard.press("End")
    page.keyboard.type("* FROM Customers;", delay=50)
    page.wait_for_timeout(300)
    
    # Click Run Query
    run_btn = page.get_by_role("button", name="Run Query")
    run_btn.click()
    page.wait_for_timeout(1400)
    
    # Click Submit Lab
    submit_btn = page.get_by_role("button", name="Submit Lab")
    submit_btn.click()
    page.wait_for_timeout(1800)
    
    context.close()
    video_path = page.video.path()
    browser.close()

print(f"Raw recorded video saved at: {video_path}")
raw_video = Path(video_path)

out_mp4 = RECORD_DIR / "demo-5s.mp4"
out_webm = RECORD_DIR / "demo-5s.webm"
out_gif = RECORD_DIR / "demo-5s.gif"
out_poster = RECORD_DIR / "demo-poster.png"

# Inspect raw video duration
probe_cmd = [FFMPEG_BIN, "-i", str(raw_video)]
probe_res = subprocess.run(probe_cmd, stderr=subprocess.PIPE, text=True)
for line in probe_res.stderr.splitlines():
    if "Duration" in line:
        print("FFmpeg probe info:", line)

# Step 2: Use FFmpeg to trim the video:
# We seek right to the moment the lab was ready with starter code!
# Let's find out how long the navigation + login took:
# Usually login + lab load takes ~4-5 seconds.
# We can accurately cut 5.0 seconds from the end:
# Total duration minus ~5.2 seconds gives the start point!
import re
match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", probe_res.stderr)
if match:
    hours, minutes, seconds = match.groups()
    total_sec = int(hours)*3600 + int(minutes)*60 + float(seconds)
    seek_start = max(0.0, total_sec - 5.1)
    print(f"Total video length: {total_sec:.2f}s, trimming from {seek_start:.2f}s for exactly 5.0s!")
else:
    seek_start = 4.0

cmd_mp4 = [
    FFMPEG_BIN, "-y",
    "-ss", str(seek_start),
    "-i", str(raw_video),
    "-t", "5.0",
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    str(out_mp4)
]
print("Generating MP4:", " ".join(cmd_mp4))
subprocess.run(cmd_mp4, check=True)

# Step 3: Re-encode WebM directly from out_mp4
cmd_webm = [
    FFMPEG_BIN, "-y",
    "-i", str(out_mp4),
    "-c:v", "libvpx-vp9",
    "-crf", "28",
    "-b:v", "0",
    str(out_webm)
]
print("Generating WebM:", " ".join(cmd_webm))
subprocess.run(cmd_webm, check=True)

# Step 4: Generate high-definition palette-optimized animated GIF
cmd_gif = [
    FFMPEG_BIN, "-y",
    "-i", str(out_mp4),
    "-vf", "fps=20,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
    str(out_gif)
]
print("Generating GIF:", " ".join(cmd_gif))
subprocess.run(cmd_gif, check=True)

# Step 5: Extract high-res poster frame at 2.5s (when query results are visible)
cmd_poster = [
    FFMPEG_BIN, "-y",
    "-ss", "00:00:02.500",
    "-i", str(out_mp4),
    "-vframes", "1",
    "-q:v", "2",
    str(out_poster)
]
print("Extracting poster:", " ".join(cmd_poster))
subprocess.run(cmd_poster, check=True)

print("SUCCESS: Demo assets generated from the LIVE RUNNING application!")
