from flask import Flask, render_template, jsonify
import requests

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/weather")
def weather():
    url = "https://api.open-meteo.com/v1/forecast"
    params = {"latitude": 0, "longitude": 0, "current_weather": True}
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    return jsonify(resp.json())

if __name__ == "__main__":
    app.run(debug=True)
