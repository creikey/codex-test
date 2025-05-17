import os
import subprocess
import unittest

class PuppeteerTest(unittest.TestCase):
    def test_screenshot(self):
        check_cmd = ['node', '-e', 'try{require("puppeteer");}catch(e){process.exit(1);}']
        if subprocess.call(check_cmd) != 0:
            self.skipTest('puppeteer not installed')
        script = os.path.join(os.path.dirname(__file__), 'e2e', 'test_screenshot.js')
        subprocess.check_call(['node', script])
        self.assertTrue(os.path.exists(os.path.join(os.path.dirname(__file__), 'e2e', 'screenshot.png')))

if __name__ == '__main__':
    unittest.main()
