// https://www.hongkongpost.hk/opendata/DataDictionary/tc/DataDictionary_postOffice.pdf

const cmn = require("../../common");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://www.hongkongpost.hk/opendata/post-office.json";

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
    let result = [];
    data.data.map(item => {
        let temp = {};
        for (let key in item) {
            let m;
            if (m = key.match(/^([A-z]+)(TC|SC|EN)$/)) {
                if (!(m[1] in temp)) temp[m[1]] = {};
                temp[m[1]][m[2].toLowerCase()] = item[key];
            } else if (/longitude|latitude/.test(key)) {
                if (!("coordinate" in temp)) temp.coordinate = {};
                temp.coordinate[key] = item[key];
            } else if (/^(openHour|busyHour)$/.test(key)) {
                let type = key == "openHour" ? "opening" : key,
                    days = {
                        "1": "mon",
                        "2": "tue",
                        "3": "wed",
                        "4": "thu",
                        "5": "fri",
                        "6": "sat",
                        "7": "sun",
                        "P": "ph",
                    };
                temp[type] = {
                    mon: [],
                    tue: [],
                    wed: [],
                    thu: [],
                    fri: [],
                    sat: [],
                    sun: [],
                    ph: [],
                };
                item[key].map(v => {
                    temp[type][days[v.dayOfWeekCode]].push(`${v.timeFm}-${v.timeTo}`)
                })
                for (let day in temp[type]) {
                    if (temp[type][day].length == 0) temp[type][day] = false;
                }
            } else {
                temp[key] = item[key];
            }
        }
        if ("coordinate" in temp) {
            temp.coordinate = new Coordinate(temp.coordinate);
        }
        result.push(temp);
    })
    return result;
}

module.exports = search;