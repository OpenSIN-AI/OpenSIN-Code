#!/opt/homebrew/bin/python3
import sys, json, asyncio, threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler

sys.path.insert(0, str(Path(__file__).parent.parent))
from core.main_rotate import rotate_account

PORT = 7656

class Handler(BaseHTTPRequestHandler):
    async def do_GET_async(self):
        if self.path == "/health":
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"OK")
        elif self.path == "/rotate":
            threading.Thread(target=lambda: asyncio.run(rotate_account()), daemon=True).start()
            self.send_response(202)
            self.end_headers()
            self.wfile.write(b"Rotation triggered")
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        asyncio.run(self.do_GET_async())

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Antigravity Rotation API listening on http://0.0.0.0:{PORT}")
    server.serve_forever()
