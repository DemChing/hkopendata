const airports = require('./airports.json');
const airlines = require('./airlines.json');
const stations = require('./hko-station.json');
const location = require('./hk-location.json');

let regions = Object.keys(location.region).map(v => location.region[v]),
    legco = Object.keys(location.legco).map(v => location.legco[v]),
    districts = [];

location.district.map((district) => {
    districts.push({
        name: {
            ...district.name
        },
        flat: district.flat,
        location: district.location,
        region: location.region[district.region],
        legco: location.legco[district.legco],
    })
})

module.exports = {
    airports,
    airlines,
    stations,
    regions,
    legco,
    districts,
}