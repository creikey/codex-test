# codex-test
Codex test

## World Dashboard

This is a minimal Python web app that serves a world dashboard.  It runs on the
standard library only so it can execute without installing any external
packages.  The interface displays an interactive map and overlays several types
of information so you can keep an eye on events around the globe.

### Setup

1. Run the app
   ```bash
   python app.py
   ```

Open your browser at `http://localhost:8080` to see the dashboard. The page
shows an interactive world map with a day/night overlay and displays mock
weather data at the equator as an example.

## Features

The current demo includes a few sample overlays to showcase future plans:

* **Shipping containers** – markers show the simulated locations of cargo
  vessels around the globe.
* **Flights** – aircraft icons highlight example planes in the air.
* **News and NASA alerts** – a panel under the map lists recent headlines and
  space-related warnings.
* **Wind patterns** – blue circles visualize areas of stronger wind.
* **Thermal view** – click the *Toggle Thermal View* button to apply a heat-map
  style filter to the map.
* **Bitcoin block location** – shows the latest block height with a marker. When
  network access is unavailable, a placeholder is used.

## Roadmap

Below are some milestones for extending this project into a comprehensive world
dashboard:

1. **Local map data** – bundle all required JavaScript assets to avoid external
   network dependencies.
2. **Additional data sources** – integrate feeds for shipping, flights, news and
   economics.
3. **Automatic analysis** – provide a simple AI-powered summary of data
   trends.
4. **Testing** – expand automated tests and add screenshot checks once a
   headless browser is available in the environment. A basic Puppeteer script
   is included under `tests/e2e` which captures a screenshot of the map if the
   library is installed.
5. **Deployment** – package the app so it can run easily on any machine.

### Thoughts on Implementation

The dashboard will grow iteratively.  First the application must be completely
self-contained so it can run without internet access.  From there each new data
source (shipping, flights, news and markets) can be integrated using small
fetchers that place their data on the map.  Once the feeds are reliable,
lightweight AI routines can summarise trends.  Finally, automated screenshot
tests should ensure the map renders correctly as features are added and the
project can then be packaged for deployment on any system.
