const cmn = require("../../common");
const BASE_URL = "http://static.data.gov.hk/tramways/datasets/{data}_{lang}.csv";

const ENDPOINT = {
    "route": "main_routes/tramways_main_routes",
    "route-stop": "tram_stops/summary_tram_stops",
}
const VALID = {
    type: /^(route|route-stop)$/,
    lang: /^en|tc|sc$/,
}
const VALID_OPT = {
    route: /^[0-9]+$/,
    stop: /^[A-z]+$/,
    dir: /^[0-1]$/,
}
const PARAMS = {
    type: "route",
    dir: 0,
    lang: "en",
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "route-stop"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (!result.error) {
        if ("stop" in params) params.stop = params.stop.toUpperCase();

        result.data = {
            ...{
                data: ENDPOINT[params.type]
            },
            ...params
        }
    }
    return result;
}

function search(data, opts) {
    return new Promise((resolve, reject) => {
        let processed = validateParameters({
                ...PARAMS,
                ...data
            }),
            params;
        if (processed.error) {
            reject(processed);
        } else {
            params = processed.data;
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, params))
                .then((res) => {
                    resolve(processData(res, params))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, params) {
    let result = [],
        type = params.type;

    data.body.map(row => {
        let temp = {};
        if (type == "route") {
            temp.route = row[0];
            temp.origin = row[1];
            temp.destination = row[2];
        } else if (type == "route-stop") {
            const codes = {
                SKT: /Shau Kei Wan|筲箕灣|筲箕湾/,
                NPT: /North Point|北角/,
                CBT: /Causeway Bay|銅鑼灣|铜锣湾/,
                HVT: /Happy Valley|跑馬地|跑马地/,
                WMT: /Western Market|上環|上环/,
                WST: /Shek Tong Tsui|石塘咀/,
                KTT: /Kennedy Town|堅尼地城|坚尼地城/,
            }
            temp.direction = row[0];
            temp.code = row[1];
            temp.name = row[2];

            if (temp.code == "T") {
                for (let code in codes) {
                    if (codes[code].test(temp.name)) {
                        temp.code = code;
                    }
                }
            }
        }
        result.push(temp);
    });

    if (type == "route-stop") {
        result = result.filter(v => {
            let west = /West|西/.test(v.direction);
            return params.dir == 0 ? !west : west;
        }).map(v => {
            delete v.direction;
            return v;
        })
    } else if (type == "route") {
        if ("route" in params) {
            result = result.filter(v => params.route == v.route);
        }
    }

    return result;
}

module.exports = search;