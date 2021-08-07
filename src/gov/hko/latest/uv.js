// https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/HKO_open_data_15min_uvindex_Documentation.pdf

const moment = require("../../../moment");
const cmn = require("../../../common");
const BASE_URL = "https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_15min_uvindex.csv";

function search(opts) {
    return new Promise((resolve, reject) => {
        cmn.CSVFetch(BASE_URL)
            .then((res) => {
                resolve(processData(res));
            })
            .catch((err) => reject(err))
    })
}

function processData(data) {
    return data.body.map(row => {
            if (row[1] === "N/A" || row[1].trim() === "") return false;
            let date = moment(row[0], 'YYYYMMDDHHmm')
            return {
                date: date.format('YYYY-MM-DD'),
                time: date.format('HH:mm'),
                value: row[1]
            }
        })
        .filter(row => row)
}

module.exports = search;