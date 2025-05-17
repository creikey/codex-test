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
