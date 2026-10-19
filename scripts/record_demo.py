import os
import time
import subprocess
import glob
from pathlib import Path
from playwright.sync_api import sync_playwright

WORKSPACE_ROOT = Path("d:/Projects/study-web").resolve()
HTML_PATH = (WORKSPACE_ROOT / "scripts/demo_workspace.html").as_uri()
RECORD_DIR = WORKSPACE_ROOT / "docs/assets"
RECORD_DIR.mkdir(parents=True, exist_ok=True)

FFMPEG_BIN = r"C:\Users\KhanhDuy\AppData\Local\Microsoft\WinGet\Links\ffmpeg.exe"

print(f"Loading HTML: {HTML_PATH}")
print(f"Output Directory: {RECORD_DIR}")

# Step 1: Launch Playwright & Record with Edge
with sync_playwright() as p:
    browser = p.chromium.launch(
        channel="msedge",
        headless=True,
        args=["--disable-gpu", "--no-sandbox"]
    )
    context = browser.new_context(
        viewport={"width": 1280, "height": 720},
        device_scale_factor=1,
        record_video_dir=str(RECORD_DIR),
        record_video_size={"width": 1280, "height": 720}
    )
    page = context.new_page()
    # Signal manual trigger before navigation so it doesn't auto-start
    page.add_init_script("window.__MANUAL_TRIGGER = true;")
    page.goto(HTML_PATH)
    page.wait_for_selector(".workspace-body")
    # Wait 400ms for Chromium to fully paint the complete initial workspace
    page.wait_for_timeout(400)
    
    # Start the demo timeline
    page.evaluate("window.startDemoTimeline()")
    # Record the 5.0-second action timeline plus a small buffer
    page.wait_for_timeout(5100)
    
    context.close()
    video_path = page.video.path()
    browser.close()

print(f"Raw recorded video saved at: {video_path}")

raw_video = Path(video_path)
out_mp4 = RECORD_DIR / "demo-5s.mp4"
out_webm = RECORD_DIR / "demo-5s.webm"
out_gif = RECORD_DIR / "demo-5s.gif"
out_poster = RECORD_DIR / "demo-poster.png"

# Step 2: Use ffmpeg to convert to crisp 5s MP4, seeking past the navigation phase (~0.5s)
cmd_mp4 = [
    FFMPEG_BIN, "-y",
    "-ss", "0.5",
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

# Step 3: Re-encode WebM directly from trimmed out_mp4
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

# Step 4: Generate high-definition palette-optimized animated GIF for GitHub README inline preview
cmd_gif = [
    FFMPEG_BIN, "-y",
    "-i", str(out_mp4),
    "-vf", "fps=20,scale=1080:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:reserve_transparent=0[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3",
    str(out_gif)
]
print("Generating GIF:", " ".join(cmd_gif))
subprocess.run(cmd_gif, check=True)

# Step 5: Extract a high-res poster frame at 3.0s
cmd_poster = [
    FFMPEG_BIN, "-y",
    "-ss", "00:00:03.000",
    "-i", str(out_mp4),
    "-vframes", "1",
    "-q:v", "2",
    str(out_poster)
]
print("Generating Poster:", " ".join(cmd_poster))
subprocess.run(cmd_poster, check=True)

# Remove the temporary raw webm file if different from out_webm
if raw_video != out_webm and raw_video.exists():
    try:
        raw_video.unlink()
    except Exception as e:
        print("Note on cleanup:", e)

print("All video assets generated successfully!")
print(f"MP4: {out_mp4} ({out_mp4.stat().st_size} bytes)")
print(f"GIF: {out_gif} ({out_gif.stat().st_size} bytes)")
print(f"WebM: {out_webm} ({out_webm.stat().st_size} bytes)")
print(f"Poster: {out_poster} ({out_poster.stat().st_size} bytes)")
