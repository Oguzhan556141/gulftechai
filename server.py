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
                query = self.path.split('?')[-1] if '?' in self.path else ''
                # Specifically extract model from path or query if needed, 
                # but for now we'll just handle the primary model redirection
                
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                
                env = self.load_env()
                gemini_key = env.get('GEMINI_API_KEY')

                if not gemini_key:
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"error": "GEMINI_API_KEY missing in .env"}')
                    return

                # In Gemini, the key is usually a query param
                # The frontend will send the model as part of the body or path
                # Let's assume the frontend sends the full path needed AFTER /api/gemini
                # e.g., /api/gemini/v1beta/models/gemini-pro:generateContent
                
                remote_path = self.path.replace('/api/gemini', '')
                if '?' in remote_path:
                    url = f"https://generativelanguage.googleapis.com{remote_path}&key={gemini_key}"
                else:
                    url = f"https://generativelanguage.googleapis.com{remote_path}?key={gemini_key}"

                req = urllib.request.Request(
                    url,
                    data=post_data,
                    headers={'Content-Type': 'application/json'},
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
