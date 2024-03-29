// https://opendata.mtr.com.hk/doc/LR_Next_Train_DataDictionary_v1.0.pdf //eta
// https://opendata.mtr.com.hk/doc/LR_Next_Train_API_Spec_v1.1.pdf //eta

const cmn = require("../../common");
const BASE_URL = "https://opendata.mtr.com.hk/data/{data}.csv";
const BASE_URL2 = "https://rt.data.gov.hk/v1/transport/mtr/lrt/getSchedule";

const ENDPOINT = {
    "route": "light_rail_routes_and_stops",
    "route-stop": "light_rail_routes_and_stops",
    "fare": "light_rail_fares",
}
const VALID = {
    type: /^(route|route-stop|fare|eta)$/
}
const VALID_OPT = {
    route: /^[A-z0-9]+$/,
    dir: /^(0|1)$/,
    from: /^[0-9]+$/,
    to: /^[0-9]+$/,
    stop: /^[0-9]+$/,
}
const FIELDS = {
    regex: {
        "^fare_": "",
        "^dest_": "destination_",
    },
    text: {
        "sequence": "seq",
        "line code": "route",
        "route_no": "route",
        "stop code": "stop",
        "direction": "dir",
        "from_station_id": "from",
        "to_station_id": "to",
        "train_length": "trainNumber",
    }
}
const PARAMS = {
    type: "route",
    dir: 0,
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "route-stop", "fare", "eta"]
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
    if (/^eta$/.test(params.type)) {
        if ("stop" in params) {
            params.station_id = params.stop;
        } else {
            result.error = true;
            result.message = "Missing stop";
        }
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
            if (params.type == "eta") {
                cmn.APIRequest(BASE_URL2, params)
                    .then((res) => {
                        try {
                            resolve(processData2(res, params))
                        } catch (e) {
                            reject(e);
                        }
                    })
                    .catch((err) => reject(err))
            } else {
                cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, params))
                    .then((res) => {
                        resolve(processData(res, params))
                    })
                    .catch((err) => reject(err))
            }
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
                    direction: parseInt(params.dir),
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
        } else {
            for (let route in temp) {
                for (let dir in temp[route]) {
                    let stops = temp[route][dir];
                    result.push({
                        route,
                        origin: stops[0].name,
                        destination: stops[stops.length - 1].name,
                        direction: parseInt(dir),
                        companyCode: "MTR"
                    })
                }
            }
        }

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

function processData2(data, params) {
    if (data.status == "0") {
        let message = data.message;
        switch (data.message) {
            case "File No Exist!":
            case undefined:
                message = "Invalid route/stop";
        }
        throw message;
    } else {
        data = data.platform_list || [];
        let results = [];
        data.map(platform => {
            (platform.route_list || []).map(item => {
                item = cmn.RenameFields(item, FIELDS);

                let temp = {},
                    eta = 'eta';
                for (let key in item) {
                    let m, ckey = key.toCamelCase();
                    if (m = key.match(/(.+)_(en|ch)/)) {
                        if (!(m[1] in temp)) temp[m[1]] = {};
                        temp[m[1]][m[2] === 'ch' ? 'tc' : m[2]] = item[key];
                    } else if (key === "arrival_departure") {
                        eta = `et${item[key].toLowerCase()}`;
                    } else if (key !== "stop") {
                        temp[ckey] = item[key];
                    }
                }
                temp[eta] = temp.time;
                delete temp.time;
                temp.platform = platform.platform_id;
                results.push(temp);
            })
        })

        return results;
    }
}

module.exports = search;