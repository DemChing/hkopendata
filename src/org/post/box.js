// https://www.hongkongpost.hk/opendata/DataDictionary/tc/DataDictionary_streetBox.pdf

const cmn = require("../../common");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://www.hongkongpost.hk/opendata/street-box.json";

const RENAME = {
    regex: {
        "location": "place"
    },
    text: {
        "boxNo": "boxCode"
    }
}

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
        item = cmn.RenameFields(item, RENAME);
        for (let key in item) {
            let m;
            if (m = key.match(/^([A-z]+)(TC|SC|EN)$/)) {
                if (!(m[1] in temp)) temp[m[1]] = {};
                temp[m[1]][m[2].toLowerCase()] = item[key];
            } else if (/longitude|latitude/.test(key)) {
                if (!("coordinate" in temp)) temp.coordinate = {};
                temp.coordinate[key] = item[key];
            } else if (/CollectionTime$/.test(key)) {
                if (!("collectionTime" in temp)) temp.collectionTime = {
                    mon: false,
                    tue: false,
                    wed: false,
                    thu: false,
                    fri: false,
                    sat: false,
                    sun: false,
                };
                m = key.match(/^(week|sat|sun)/);
                if (m[1] == "week") {
                    Object.keys(temp.collectionTime).filter(v => !/sat|sun/.test(v)).map(v => temp.collectionTime[v] = item[key]);
                } else {
                    temp.collectionTime[m[1]] = item[key];
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