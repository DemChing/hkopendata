// https://opendata.mtr.com.hk/doc/MTR_BUS_DataDictionary_v1.0.pdf // eta
// https://opendata.mtr.com.hk/doc/MTR_BUS_API_Spec_v1.0.pdf // eta

const cmn = require("../../common");
const moment = require("../../moment");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://opendata.mtr.com.hk/data/{data}.csv";
const BASE_URL2 = "https://rt.data.gov.hk/v1/transport/mtr/bus/getSchedule";

const ENDPOINT = {
    "route": "mtr_bus_routes",
    "route-stop": "mtr_bus_stops",
    "fare": "mtr_bus_fares",
}
const VALID = {
    type: /^(route|route-stop|fare|eta)$/
}
const VALID_OPT = {
    route: /^[A-z0-9]+$/,
    lang: /^(en|zh)$/,
}
const FIELDS = {
    regex: {
        "^(route|station|fare)_": "",
    },
    text: {
        "busId": "id",
        "busRemark": "remark",
    },
    boolean: {
        "isSuspended": "suspended",
        "isDelayed": "delayed",
        "isScheduled": "scheduled",
    },
    other: {
        "busLocation": "coordinate"
    }
}
const PARAMS = {
    type: "route",
    lang: "en",
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                en: "en",
                tc: "zh",
            }
        },
        type: {
            accepted: ["route", "route-stop", "fare", "eta"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (!result.error && /^(route-stop|fare|eta)$/.test(params.type) && !("route" in params)) {
        result.error = true;
        result.message = "Missing route";
    }
    if (!result.error) {
        if ("route" in params) params.route = params.route.toUpperCase();
        if (params.type === "eta") {
            params.routeName = params.route;
            params.language = params.lang;
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
            if (m = key.match(/^(.+)_(chi|eng)$/)) {
                ckey = m[1].toCamelCase();
                if (!(ckey in temp)) temp[ckey] = {}
                temp[ckey][m[2] == "chi" ? "tc" : "en"] = item[key].decodeEntities();
            } else if (m = key.match(/(octo|single)_(.+)/)) {
                let t = m[1] == "octo" ? "octopus" : "cash",
                    p = m[2] == "pwd" ? "disability" : m[2];
                if (!("fare" in temp)) temp.fare = {};
                if (!(t in temp.fare)) temp.fare[t] = {};
                temp.fare[t][p] = item[key].parseNumber(2);
            } else if (/seqno/.test(key)) {
                temp[ckey] = parseInt(item[key]);
            } else {
                temp[ckey] = item[key].decodeEntities();
            }
        }
        result.push(temp);
    })

    if (type == "route") {
        result = result.map(v => {
            let t = {
                route: v.id,
                origin: {},
                destination: {},
                companyCode: "MTR"
            };
            for (let l in v.name) {
                let name = v.name[l].split(/ to |至/);
                t.origin[l] = name[0].trim();
                t.destination[l] = name[1].trim();
            }
            return t;
        })
    } else if (type == "route-stop") {
        let temp = {};
        result.map(v => {
            if (!(v.id in temp)) temp[v.id] = {};
            temp[v.id][v.seqno] = v;
        })
        result = [];
        for (let route in temp) {
            let r = Object.keys(temp[route]).sort((a, b) => a - b).map(v => temp[route][v]);
            r.push(temp[route][r[r.length - 1].nextSeqno]);
            temp[route] = r;
        }
        if (params.route in temp) result = temp[params.route].map(v => {
            return {
                name: v.name,
                seq: v.seqno,
            }
        })

    } else if (type == "fare") {
        result = result.filter(v => v.id == params.route)
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
        data = data.busStop || [];
        let result = [],
            temp = {};

        data.map(item => temp[item.busStopId] = cmn.RenameFields(item.bus, FIELDS));
        for (let stop in temp) {
            let buses = temp[stop].map(item => {
                let temp2 = {},
                    match;
                for (let key in item) {
                    if (match = key.match(/^(a|d)[a-z]+TimeInSecond$/)) {
                        temp2[`et${match[1]}`] = moment().add(item[key], "s");
                    } else if (key === "coordinate") {
                        temp2[key] = new Coordinate(item[key]);
                    } else if (!/TimeText$|lineRef/.test(key)) {
                        temp2[key] = item[key];
                    }
                }
                return temp2;
            })
            result.push({
                id: stop,
                buses
            });
        }

        return result;
    }
}

module.exports = search;