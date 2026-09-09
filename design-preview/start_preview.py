from __future__ import annotations

import argparse
import html
import mimetypes
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PREVIEW_DIR = Path(__file__).resolve().parent
PREVIEW_FRAGMENT = PREVIEW_DIR / "ink-spirit-design-preview.html"


def build_page() -> bytes:
    if not PREVIEW_FRAGMENT.exists():
        message = html.escape(f"Preview file not found: {PREVIEW_FRAGMENT}")
        return f"<!doctype html><meta charset='utf-8'><pre>{message}</pre>".encode("utf-8")

    fragment = PREVIEW_FRAGMENT.read_text(encoding="utf-8")
    document = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f2efe7">
  <meta name="description" content="INK.SPIRIT 动态水墨视觉方向预览">
  <title>INK.SPIRIT · 墨有锋芒</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='%2311110f'/%3E%3Cpath d='M13 18c11 1 24 7 38 3M16 44c12-17 23-12 33-24' stroke='%23f2efe7' stroke-width='5' fill='none' stroke-linecap='square'/%3E%3Cpath d='M30 43l19-8' stroke='%23bc201d' stroke-width='7'/%3E%3C/svg%3E">
  <style>html, body {{ margin: 0; min-width: 320px; background: #f2efe7; scroll-behavior: smooth; }}</style>
</head>
<body>
{fragment}
</body>
</html>
"""
    return document.encode("utf-8")


class PreviewHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        request_path = self.path.split("?", 1)[0]
        if request_path in ("/", "/index.html"):
            content = build_page()
            content_type = "text/html; charset=utf-8"
        else:
            relative_path = request_path.lstrip("/")
            candidate = (PREVIEW_DIR / relative_path).resolve()
            if candidate.parent != PREVIEW_DIR or not candidate.is_file():
                self.send_error(404)
                return
            content = candidate.read_bytes()
            content_type = mimetypes.guess_type(candidate.name)[0] or "application/octet-stream"

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format: str, *args: object) -> None:
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="Start the INK.SPIRIT visual preview.")
    parser.add_argument("--port", type=int, default=8765, help="Local port (default: 8765)")
    parser.add_argument("--no-open", action="store_true", help="Do not open the browser automatically")
    args = parser.parse_args()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), PreviewHandler)
    url = f"http://127.0.0.1:{args.port}"
    print(f"INK.SPIRIT preview: {url}")
    print("Press Ctrl+C to stop.")

    if not args.no_open:
        threading.Timer(0.5, webbrowser.open, args=(url,)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPreview stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
