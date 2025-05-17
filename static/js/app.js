const map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

const terminator = L.terminator();
terminator.addTo(map);

function updateTerminator() {
    terminator.setTime(new Date());
}
updateTerminator();
setInterval(updateTerminator, 1800000);

fetch('/api/weather')
    .then(r => r.json())
    .then(data => {
        const weather = data.current_weather;
        const text = `Weather at 0°,0°: ${weather.temperature}°C, wind ${weather.windspeed} km/h`;
        document.getElementById('weather').innerText = text;
    })
    .catch(err => console.error('Weather error', err));

// Fetch global wind patterns
fetch('/api/wind')
    .then(r => r.json())
    .then(data => {
        data.patterns.forEach(p => {
            L.circle([p.lat, p.lon], {radius: 500000, color: 'blue'})
                .bindPopup(`Wind ${p.direction} ${p.speed} km/h`)
                .addTo(map);
        });
    })
    .catch(err => console.error('Wind error', err));

// Shipping container markers
fetch('/api/shipping')
    .then(r => r.json())
    .then(data => {
        data.containers.forEach(c => {
            L.marker([c.lat, c.lon])
                .bindPopup(`Container: ${c.name}`)
                .addTo(map);
        });
    })
    .catch(err => console.error('Shipping error', err));

// Flight markers
fetch('/api/flights')
    .then(r => r.json())
    .then(data => {
        data.flights.forEach(f => {
            L.marker([f.lat, f.lon], {icon: L.divIcon({className: 'flight-icon'})})
                .bindPopup(`Flight ${f.id}`)
                .addTo(map);
        });
    })
    .catch(err => console.error('Flight error', err));

// Display news headlines and NASA issues
Promise.all([
    fetch('/api/news').then(r => r.json()),
    fetch('/api/nasa').then(r => r.json())
]).then(([news, nasa]) => {
    const lines = [
        '<strong>News</strong>:',
        ...news.articles.map(a => ' - ' + a.title),
        '<br/><strong>NASA Alerts</strong>:',
        ...nasa.problems.map(p => ' - ' + p)
    ];
    const div = document.getElementById('extras');
    div.innerHTML = lines.join('<br/>');
}).catch(err => console.error('Extras error', err));

// Thermal view toggle
document.getElementById('toggle-thermal').addEventListener('click', () => {
    const el = document.getElementById('map');
    el.classList.toggle('thermal');
});
