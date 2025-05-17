import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

ROOT_DIR = os.path.dirname(__file__)
TEMPLATE_PATH = os.path.join(ROOT_DIR, 'templates', 'index.html')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            with open(TEMPLATE_PATH, 'rb') as f:
                self.wfile.write(f.read())
        elif self.path == '/api/weather':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {
                'current_weather': {
                    'temperature': 25,
                    'windspeed': 10,
                },
                'global_summary': 'Calm conditions world wide.'
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
        elif self.path == '/api/wind':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {
                'patterns': [
                    {'lat': 30, 'lon': -20, 'speed': 15, 'direction': 'NE'},
                    {'lat': -10, 'lon': 60, 'speed': 5, 'direction': 'SW'},
                ]
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
        elif self.path == '/api/shipping':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {
                'containers': [
                    {'name': 'Atlantic Trader', 'lat': 40, 'lon': -30},
                    {'name': 'Pacific Runner', 'lat': -5, 'lon': 150},
                ]
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
        elif self.path == '/api/flights':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {
                'flights': [
                    {'id': 'AB123', 'lat': 51.5, 'lon': -0.1},
                    {'id': 'ZX987', 'lat': 34, 'lon': 138},
                ]
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
        elif self.path == '/api/news':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {
                'articles': [
                    {'title': 'Global trade surges despite challenges'},
                    {'title': 'Scientists track unusual solar activity'},
                ]
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
        elif self.path == '/api/nasa':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            data = {
                'problems': [
                    'Increased solar flare activity expected this week',
                    'Orbital debris monitoring on high alert',
                ]
            }
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            super().do_GET()


def run(port=None):
    if port is None:
        port = int(os.environ.get('PORT', 8080))
    httpd = HTTPServer(('0.0.0.0', port), Handler)
    print(f'Serving on http://0.0.0.0:{port}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    import sys
    arg_port = int(sys.argv[1]) if len(sys.argv) > 1 else None
    run(port=arg_port)
