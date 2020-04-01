// https://www.hongkongpost.hk/opendata/DataDictionary/tc/DataDictionary_ipostalStation.pdf

const cmn = require("../../common");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://www.hongkongpost.hk/opendata/ipostal-station.json";

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
            } else if (/OpenHour/.test(key)) {
                if (!("opening" in temp)) temp.opening = {
                    mon: [],
                    tue: [],
                    wed: [],
                    thu: [],
                    fri: [],
                    sat: [],
                    sun: [],
                    ph: [],
                };
                m = key.match(/^(normal|sat|sun|holiday)(.*)(Fm|To)$/);
                if (item[key] == null) {} else if (m[1] == "normal") {
                    Object.keys(temp.opening).filter(v => !/sat|sun|ph/.test(v)).map(v => temp.opening[v][m[3] == "Fm" ? 0 : 1] = item[key]);
                } else if (m[1] == "holiday") {
                    temp.opening.ph[m[3] == "Fm" ? 0 : 1] = item[key];
                } else {
                    temp.opening[m[1]][m[3] == "Fm" ? 0 : 1] = item[key];
                }
            } else {
                temp[key] = item[key];
            }
        }
        for (let day in temp.opening) {
            if (temp.opening[day].length == 0) {
                temp.opening[day] = false;
            } else if (temp.opening[day][0] == temp.opening[day][1]) {
                temp.opening[day] = "00:00-24:00";
            } else {
                temp.opening[day] = temp.opening[day].join("-");
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