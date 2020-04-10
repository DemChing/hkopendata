const cmn = require("../../common");
const BASE_URL = "https://opendata.mtr.com.hk/data/{data}.csv";

const ENDPOINT = {
    "route": "mtr_bus_routes",
    "route-stop": "mtr_bus_stops",
    "fare": "mtr_bus_fares",
}
const VALID = {
    type: /^(route|route-stop|fare)$/
}
const VALID_OPT = {
    route: /^[A-z0-9]+$/,
}
const FIELDS = {
    regex: {
        "^(route|station|fare)_": ""
    }
}
const PARAMS = {
    type: "route",
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

    if (/^(route-stop|fare)$/.test(params.type) && !("route" in params)) {
        result.error = true;
        result.message = "Missing route";
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
                name: v.name
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

module.exports = search;