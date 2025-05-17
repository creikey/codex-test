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
    def test_index_page(self):
        proc = multiprocessing.Process(target=run_app)
        proc.start()
        try:
            time.sleep(1)
            with urlopen('http://localhost:5001/') as resp:
                html = resp.read().decode('utf-8')
                self.assertIn('World Dashboard', html)
        finally:
            proc.terminate()
            proc.join()


if __name__ == '__main__':
    unittest.main()
