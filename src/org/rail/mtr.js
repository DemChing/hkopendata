// https://opendata.mtr.com.hk/doc/Next_Train_DataDictionary.pdf // eta
// https://opendata.mtr.com.hk/doc/Next_Train_API_Spec.pdf // eta

const cmn = require("../../common");
const BASE_URL = "https://opendata.mtr.com.hk/data/{data}.csv";
const BASE_URL2 = "https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php";

const ENDPOINT = {
    "route": "mtr_lines_and_stations",
    "route-stop": "mtr_lines_and_stations",
    "fare": "mtr_lines_fares",
    "ae-fare": "airport_express_fares",
}
const VALID = {
    type: /^(route|route-stop|eta|fare|ae-fare)$/
}
const VALID_OPT = {
    route: /^[A-z]+$/,
    stop: /^[A-z]+$/,
    dir: /^[0-3]$/,
    from: /^[0-9]+$/,
    to: /^[0-9]+$/,
    lang: /^(en|tc)$/,
}
const FIELDS = {
    regex: {
        "^oct_con_": "octo_",
        "^oct_": "octo_",
        "^single_con_": "single_"
    },
    text: {
        "sequence": "seq",
        "line code": "route",
        "station code": "stop",
        "direction": "dir",
        "src_station_id": "from",
        "dest_station_id": "to",
        "st_from_id": "from",
        "st_to_id": "to",
    }
}
const PARAMS = {
    type: "route",
    dir: 0,
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "route-stop", "eta", "fare", "ae-fare"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (/^(route-stop|eta)$/.test(params.type) && !("route" in params)) {
        result.error = true;
        result.message = "Missing route";
    }
    if (/^eta$/.test(params.type) && !("stop" in params)) {
        result.error = true;
        result.message = "Missing stop";
    }
    if (/fare$/.test(params.type) && (!("from" in params) || !("to" in params))) {
        result.error = true;
        result.message = "Missing origin (from) and destination (to)";
    } else if (/fare$/.test(params.type) && "from" in params && "to" in params && params.from == params.to) {
        result.error = true;
        result.message = "Same origin (from) and destination (to)";
    }

    if (!result.error) {
        if ("route" in params) params[params.type == "eta" ? "line" : "route"] = params.route.toUpperCase();
        if ("stop" in params) params[params.type == "eta" ? "sta" : "stop"] = params.stop.toUpperCase();
        if ("dir" in params) {
            if (/2|3/.test(params.dir) && !/EAL|TKL/.test(params.route)) {
                params.dir = params.dir % 2;
            }
        }
        if (params.type == "eta") {
            result.data = {
                ...params
            }
        } else {
            result.data = {
                ...{
                    data: ENDPOINT[params.type]
                },
                ...params
            }
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
            } else if (m = key.match(/(octo|single)_(.+)_fare/)) {
                let t = m[1] == "octo" ? "octopus" : "cash",
                    p = m[2];
                switch (m[2]) {
                    case "pwd":
                        p = "disability";
                        break;
                    case "adt":
                        p = "adult";
                        break;
                    case "std":
                        p = "student";
                        break;
                    case "chd":
                        p = "child";
                        break;
                }
                if (!("fare" in temp)) temp.fare = {};
                if (!(t in temp.fare)) temp.fare[t] = {};
                temp.fare[t][p] = item[key].parseNumber(2);
            } else if (/seq/.test(key)) {
                temp[ckey] = parseInt(item[key]);
            } else if (key == "dir") {
                let dirs = ["DT", "UT"],
                    dir = dirs.indexOf(item[key]);
                if (dir == -1) {
                    dirs.map((v, i) => {
                        if (item[key].indexOf(v) != -1) dir = i + 2;
                    })
                }
                temp[ckey] = dir;
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
                        _id: v.stationId,
                        code: v.stop,
                        name: v.name
                    }
                });
            }
        };

    } else if (/fare$/.test(type)) {
        result = result.filter(v => v.from == params.from && v.to == params.to)
            .map(v => {
                for (let t in v.fare) {
                    ["elderly", "disability", "student"].map(u => {
                        if (!(u in v.fare[t])) v.fare[t][u] = v.fare[t].adult;
                    })
                }
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
                message = "Invalid route/stop";
        }
        throw message;
    } else {
        data = data.data[`${params.line}-${params.sta}`];
        let result = [];
        let dir = params.dir % 2 == 0 ? "DOWN" : "UP";
        if (dir in data) {
            result = data[dir]
                .filter(v => v.valid == "Y")
                .sort((a, b) => parseInt(a.seq) - parseInt(b.seq))
                .map(v => {
                    return {
                        platform: v.plat,
                        destination: v.dest,
                        eta: v.time
                    }
                });
        }
        return result;
    }
}

module.exports = search;