// https://www.hongkongpost.hk/opendata/DataDictionary/tc/DataDictionary_mobileOffice.pdf

const cmn = require("../../common");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://www.hongkongpost.hk/opendata/mobile-office.json";

function search(opts) {
    return new Promise((resolve, reject) => {
        cmn.APIRequest(BASE_URL)
            .then((res) => {
                resolve(processData(res, opts))
            })
            .catch((err) => reject(err))
    })
}

function processData(data, opts) {
    let result = [],
        locations = {};
    data.data.map(item => {
        let days = {
                "1": "mon",
                "2": "tue",
                "3": "wed",
                "4": "thu",
                "5": "fri",
                "6": "sat",
                "7": "sun",
                "P": "ph",
            },
            k = `${item.addressTC}---${item.mobileCode}`;
        if (!(k in locations)) {
            locations[k] = {};
            for (let key in item) {
                let m;
                if (m = key.match(/^([A-z]+)(TC|SC|EN)$/)) {
                    if (!(m[1] in locations[k])) locations[k][m[1]] = {};
                    locations[k][m[1]][m[2].toLowerCase()] = item[key];
                } else if (/longitude|latitude/.test(key)) {
                    if (!("coordinate" in locations[k])) locations[k].coordinate = {};
                    locations[k].coordinate[key] = item[key];
                } else if (!/^(dayOfWeekCode|seq|openHour|closeHour)$/.test(key)) {
                    locations[k][key] = item[key];
                }
            }
            if ("coordinate" in locations[k]) {
                locations[k].coordinate = new Coordinate(locations[k].coordinate);
            }
            locations[k].opening = {
                mon: false,
                tue: false,
                wed: false,
                thu: false,
                fri: false,
                sat: false,
                sun: false,
                ph: false,
            };
        }
        locations[k].opening[days[item.dayOfWeekCode]] = `${item.openHour}-${item.closeHour}`;
    })
    for (let key in locations) {
        result.push(locations[key]);
    }
    return result;
}

module.exports = search;