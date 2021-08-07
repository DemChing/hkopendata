// https://data.weather.gov.hk/weatherAPI/doc/HKO_Open_Data_API_Documentation.pdf

const searchAstronmy = require('../astronomy');

function search(data, opts) {
    return searchAstronmy({
        ...data,
        type: 5
    }, opts)
}

module.exports = search;