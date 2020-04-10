const cmn = require("../../common");
const BASE_URL = "https://opendata.mtr.com.hk/data/{data}.csv";

const ENDPOINT = {
    "route": "light_rail_routes_and_stops",
    "route-stop": "light_rail_routes_and_stops",
    "fare": "light_rail_fares",
}
const VALID = {
    type: /^(route|route-stop|fare)$/
}
const VALID_OPT = {
    route: /^[A-z0-9]+$/,
    dir: /^(0|1)$/,
    from: /^[0-9]+$/,
    to: /^[0-9]+$/,
}
const FIELDS = {
    regex: {
        "^fare_": ""
    },
    text: {
        "sequence": "seq",
        "line code": "route",
        "stop code": "stop",
        "direction": "dir",
        "from_station_id": "from",
        "to_station_id": "to",
    }
}
const PARAMS = {
    type: "route",
    dir: 0,
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "route-stop", "fare"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (/^route-stop$/.test(params.type) && !("route" in params)) {
        result.error = true;
        result.message = "Missing route";
    }
    if (/^fare$/.test(params.type) && (!("from" in params) || !("to" in params))) {
        result.error = true;
        result.message = "Missing origin (from) and destination (to)";
    } else if (/^fare$/.test(params.type) && "from" in params && "to" in params && params.from == params.to) {
        result.error = true;
        result.message = "Same origin (from) and destination (to)";
    }
    if (!result.error) {
        if ("route" in params) params.route = params.route.toUpperCase();
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
        let temp = {},
            item = {};
        data.header.map((head, i) => item[head.toLowerCase()] = row[i])
        item = cmn.RenameFields(item, FIELDS);

        for (let key in item) {
            let m, ckey = key.toCamelCase();
            if (m = key.match(/^(chinese|english) (.+)$/)) {
                ckey = m[2].toCamelCase();
                if (!(ckey in temp)) temp[ckey] = {}
                temp[ckey][m[1] == "chinese" ? "tc" : "en"] = item[key].decodeEntities();
            } else if (m = key.match(/(octo|single)_(.+)/)) {
                let t = m[1] == "octo" ? "octopus" : "cash",
                    p = m[2] == "pwd" ? "disability" : m[2];
                if (!("fare" in temp)) temp.fare = {};
                if (!(t in temp.fare)) temp.fare[t] = {};
                temp.fare[t][p] = item[key].parseNumber(2);
            } else if (/seq|dir/.test(key)) {
                temp[ckey] = parseInt(item[key]);
            } else {
                temp[ckey] = item[key].decodeEntities();
            }
        }
        result.push(temp);
    })

    if (/route/.test(type)) {
        let temp = {};
        result.map(v => {
            if (!(v.route in temp)) temp[v.route] = {};
            if (!(v.dir in temp[v.route])) temp[v.route][v.dir] = {};
            temp[v.route][v.dir][v.seq] = v;
        })
        result = [];
        for (let route in temp) {
            let r = Object.keys(temp[route])
                .sort((a, b) => a - b)
                .map(dir => Object.keys(temp[route][dir])
                    .sort((a, b) => a - b)
                    .map(v => temp[route][dir][v])
                );
            temp[route] = r;
        }
        if (params.route in temp) {
            result = temp[params.route][params.dir];
            if (type == "route") {
                result = [{
                    route: result[0].route,
                    origin: result[0].name,
                    destination: result[result.length - 1].name,
                    companyCode: "MTR"
                }];
            } else {
                result = result.map(v => {
                    return {
                        _id: v.stopId,
                        code: v.stop,
                        name: v.name
                    }
                });
            }
        };

    } else if (type == "fare") {
        result = result.filter(v => v.from == params.from && v.to == params.to)
            .map(v => {
                if (!("disability" in v.fare.cash)) v.fare.cash.disability = v.fare.cash.adult;
                if (!("student" in v.fare.cash)) v.fare.cash.student = v.fare.cash.adult;
                return v.fare
            });
    }
    return result;
}

module.exports = search;