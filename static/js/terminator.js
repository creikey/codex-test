(function(factory, window) {
    if (typeof define === 'function' && define.amd) {
        define(['leaflet'], factory);
    } else if (typeof module !== 'undefined') {
        module.exports = factory(require('leaflet'));
    } else {
        if (!window.L) {
            throw new Error('Leaflet must be loaded first');
        }
        factory(window.L);
    }
}(function(L) {
    var rad = Math.PI / 180;

    function sunPosition(date) {
        date = date || new Date();
        var dayMs = 86400000;
        var J1970 = 2440588;
        var J2000 = 2451545;
        var d = date.getTime() / dayMs - 0.5 + J1970;
        var n = d - J2000;
        var L = (280.46 + 0.9856474 * n) % 360;
        var g = (357.528 + 0.9856003 * n) % 360;
        var lambda = (L + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad)) * rad;
        var epsilon = 23.4397 * rad;
        var RA = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
        var dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda));
        var GMST = (280.46061837 + 360.98564736629 * n) * rad;
        var lon = (RA - GMST) / rad;
        lon = ((lon + 540) % 360) - 180;
        var lat = dec / rad;
        return { lat: lat, lon: lon };
    }

    function buildTerminator(date, resolution) {
        var sun = sunPosition(date);
        var lat0 = sun.lat;
        var lon0 = sun.lon;
        var step = 360 / (resolution || 180);
        var coords = [];
        for (var lon = -180; lon <= 180; lon += step) {
            var lambda = (lon - lon0) * rad;
            var phi = Math.atan(-Math.cos(lambda) / Math.tan(lat0 * rad)) / rad;
            coords.push([phi, lon]);
        }
        coords.push(coords[0]);
        return coords;
    }

    L.Terminator = L.Polygon.extend({
        options: {
            resolution: 180,
            color: '#000',
            opacity: 0.5,
            fillOpacity: 0.2
        },
        initialize: function(options) {
            L.Util.setOptions(this, options);
            var latLngs = buildTerminator(new Date(), this.options.resolution);
            L.Polygon.prototype.initialize.call(this, latLngs, options);
        },
        setTime: function(date) {
            this.setLatLngs(buildTerminator(date, this.options.resolution));
        }
    });

    L.terminator = function(options) {
        return new L.Terminator(options);
    };
}, window));
