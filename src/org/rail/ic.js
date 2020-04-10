const cmn = require("../../common");
const BASE_URL = "https://opendata.mtr.com.hk/data/intercity_passenger_services.csv";

const FIELDS = {
    regex: {
        "^from": "origin",
        "^to": "destination",
    },
}

function search() {
    return new Promise((resolve, reject) => {
        cmn.CSVFetch(BASE_URL)
            .then((res) => {
                resolve(processData(res))
            })
            .catch((err) => reject(err))
    })
}

function processData(data) {
    let result = [];

    data.body.filter(v => v[8] == "--").map(row => {
        let temp = {},
            item = {};
        data.header.map((head, i) => item[head.toLowerCase()] = row[i])
        item = cmn.RenameFields(item, FIELDS);

        for (let key in item) {
            let m, ckey = key.toCamelCase();
            if (m = key.match(/^(.+)_(chi|eng)$/)) {
                ckey = m[1].toCamelCase();
                if (!(ckey in temp)) temp[ckey] = {}
                temp[ckey][m[2] == "chi" ? "tc" : "en"] = item[key].decodeEntities();
            } else if (m = key.match(/(.+) fare/)) {
                if (!("fare" in temp)) temp.fare = {};
                temp.fare[m[1]] = item[key].parseNumber(2);
            } else if (!/validity/.test(key)) {
                temp[ckey] = item[key].decodeEntities();
            }
        }
        result.push(temp);
    })
    return result;
}

module.exports = search;