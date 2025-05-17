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
            data = {'current_weather': {'temperature': 25, 'windspeed': 10}}
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
