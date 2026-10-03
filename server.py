import http.server
import socketserver
import urllib.request
import json
import os

# Port settings
PORT = 3000

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def load_env(self):
        env = {}
        if os.path.exists('.env'):
            with open('.env', 'r', encoding='utf-8') as f:
                for line in f:
                    if '=' in line:
                        k, v = line.strip().split('=', 1)
                        env[k] = v
        return env

    def do_GET(self):
        if self.path.startswith('/api/instagram'):
            self.handle_instagram()
        elif self.path.startswith('/api/gemini'):
            self.do_POST()
        else:
            super().do_GET()

    def handle_instagram(self):
        import re
        username = 'gulftechtr'
        result = {"success": False, "username": username}
        try:
            url = f"https://i.instagram.com/api/v1/users/web_profile_info/?username={username}"
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Instagram 219.0.0.12.117 Android',
                'X-IG-App-ID': '936619743392459'
            })
            with urllib.request.urlopen(req, timeout=5) as res:
                data = json.loads(res.read().decode('utf-8'))
                u = data.get('data', {}).get('user', {})
                if u:
                    result = {
                        "success": True,
                        "source": "instagram_api",
                        "username": username,
                        "followers": u.get('edge_followed_by', {}).get('count'),
                        "following": u.get('edge_follow', {}).get('count'),
                        "posts": u.get('edge_owner_to_timeline_media', {}).get('count'),
                        "bio": u.get('biography', '')
                    }
        except Exception:
            pass

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

    def do_POST(self):
        if self.path == '/api/chat':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                
                env = self.load_env()
                wiro_api = env.get('WIRO_API')
                wiro_secret = env.get('WIRO_SECRET')

                if not wiro_api or not wiro_secret:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"error": "API keys missing in .env"}')
                    return

                # Prepare headers (ensure values are strings for urllib)
                req_headers = {
                    'Content-Type': 'application/json',
                    'X-API-Key': str(wiro_api),
                    'X-Secret-Key': str(wiro_secret)
                }

                # Forward to Wiro AI
                req = urllib.request.Request(
                    'https://api.w.ai/v1/chat/completions',
                    data=post_data,
                    headers=req_headers,
                    method='POST'
                )

                with urllib.request.urlopen(req) as response:
                    res_body = response.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(res_body)

            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

        elif self.path.startswith('/api/gemini'):
            try:
                env = self.load_env()
                gemini_key = env.get('GEMINI_API_KEY')

                if not gemini_key:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"error": "GEMINI_API_KEY missing in .env"}')
                    return

                remote_path = self.path.replace('/api/gemini', '')
                if '?' in remote_path:
                    url = f"https://generativelanguage.googleapis.com{remote_path}&key={gemini_key}"
                else:
                    url = f"https://generativelanguage.googleapis.com{remote_path}?key={gemini_key}"

                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length) if content_length > 0 else None

                req = urllib.request.Request(
                    url,
                    data=post_data,
                    headers={'Content-Type': 'application/json'} if post_data else {},
                    method=self.command
                )

                with urllib.request.urlopen(req) as response:
                    res_body = response.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(res_body)

            except urllib.error.HTTPError as e:
                err_body = e.read()
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_body)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_error(405, "Method Not Allowed")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    # Allow port reuse to prevent "Address already in use" errors
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ProxyHandler) as httpd:
        print(f"GulfTech AI Dashboard: http://localhost:{PORT}")
        httpd.serve_forever()
