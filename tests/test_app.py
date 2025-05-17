import json
import multiprocessing
import os
import sys
import time
import unittest
from urllib.request import urlopen

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import app


def run_app():
    app.run(port=5001)


class AppTest(unittest.TestCase):
    def setUp(self):
        self.proc = multiprocessing.Process(target=run_app)
        self.proc.start()
        time.sleep(1)

    def tearDown(self):
        self.proc.terminate()
        self.proc.join()

    def get_json(self, path):
        with urlopen(f'http://localhost:5001{path}') as resp:
            return json.loads(resp.read().decode('utf-8'))

    def test_index_page(self):
        with urlopen('http://localhost:5001/') as resp:
            html = resp.read().decode('utf-8')
            self.assertIn('World Dashboard', html)

    def test_weather_endpoint(self):
        data = self.get_json('/api/weather')
        self.assertIn('current_weather', data)

    def test_wind_endpoint(self):
        data = self.get_json('/api/wind')
        self.assertIn('patterns', data)

    def test_shipping_endpoint(self):
        data = self.get_json('/api/shipping')
        self.assertIn('containers', data)

    def test_flights_endpoint(self):
        data = self.get_json('/api/flights')
        self.assertIn('flights', data)

    def test_news_endpoint(self):
        data = self.get_json('/api/news')
        self.assertIn('articles', data)

    def test_nasa_endpoint(self):
        data = self.get_json('/api/nasa')
        self.assertIn('problems', data)

    def test_bitcoin_endpoint(self):
        data = self.get_json('/api/bitcoin')
        self.assertIn('lat', data)
        self.assertIn('lon', data)


if __name__ == '__main__':
    unittest.main()

