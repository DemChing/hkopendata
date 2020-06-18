const cmn = require("../../common");
const moment = require("../../moment");
const UnitValue = require("../../_class").UnitValue;
const BASE_URL = "http://www.starferry.com.hk/sites/default/files/ferry_sf_{route}_{data}_updatedon022018_{lang}.csv";

const ENDPOINT = {
    "route": "timetable",
    "fare": "faretable",
    "time": "timetable",
}
const ROUTES = ["central_tsimshatsui", "wanchai_tsimshatsui"]
const VALID = {
    type: /^(route|time|fare)$/,
    route: new RegExp(`^(${ROUTES.join("|")})$`),
    lang: /^(eng|chi|chi \(1\))$/,
    dir: /^(0|1)$/,
}
const PARAMS = {
    type: "route",
    dir: 0,
    lang: "en"
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "time", "fare"]
        },
        route: {
            accepted: ROUTES
        },
        lang: {
            accepted: {
                tc: "chi",
                sc: "chi (1)",
                en: "eng"
            }
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);

    if (!("route" in params)) {
        result.error = true;
        result.message = "Missing route";
    }
    if (!result.error) {
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
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, params), {
                    encoding: params.route == ROUTES[0] ? "utf8" : "big5", // Hard-code for specific route
                    from_line: params.type == "fare" ? 12 : params.type == "time" ? 8 : 1
                })
                .then((res) => {
                    resolve(processData(res, params))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, params) {
    let result = [],
        type = params.type,
        wd = (str) => {
            return /除外|Except/i.test(str)
        };

    if (type == "route") {
        let temp = {
            _id: params.route,
            route: "",
            origin: "",
            destination: "",
            companyCode: "SF"
        }
        let route = data.body[1][1].split("\n"),
            ori = route[0].split(": "),
            dest = route[1].split(": "),
            duration = data.body[2][1].match(/(\d+)/);
        temp.route = `${ori[0]} - ${dest[0]}`;
        temp.origin = ori[1];
        temp.destination = dest[1];
        if (duration) temp.duration = new UnitValue({
            type: "time",
            category: "min",
            value: parseFloat(duration[1]),
        });
        result.push(temp)
    } else if (type == "time") {
        let temp = {};
        data.body.map(row => {
            let day = wd(row[1]) ? "wd" : "ssp",
                time = row[2].split("-"),
                from = moment(time[0], "hh:mmA").format("HH:mm"),
                to = moment(time[1], "hh:mmA").format("HH:mm"),
                freq = row[3].replace("/", "-").split("-"),
                frequency = new UnitValue({
                    type: "time",
                    category: "min",
                    value: parseFloat(freq[0]),
                    every: true
                });
            if (!(row[0] in temp)) temp[row[0]] = {};
            if (!(day in temp[row[0]])) temp[row[0]][day] = [];
            if (freq.length > 1) {
                frequency = {
                    min: new UnitValue({
                        type: "time",
                        category: "min",
                        value: parseFloat(freq[1]),
                        every: true
                    }),
                    max: frequency
                }
            }
            temp[row[0]][day].push({
                period: `${from}-${to}`,
                frequency
            });
        })
        result.push(temp[Object.keys(temp)[params.dir]]);
    } else if (type == "fare") {
        let passenger = ["adult", "child", "disability", "elderly", "monthlyTicket", "touristTicket", "bicycle"],
            temp = {};
        data.body.map((row, i) => {
            let pass = passenger[i];
            row.splice(-2, 2);
            row.map((v, j) => {
                if (v != "") {
                    if (!(pass in temp)) temp[pass] = {};
                    if (j > 0) {
                        let time = j < (row.length / 2) ? "wd" : "ssp";
                        if (!(time in temp[pass])) temp[pass][time] = {};
                        temp[pass][time][j % 2 == 0 ? "lowerDeck" : "upperDeck"] = v.parseNumber(1);
                    }
                } else {}
            })
        });
        for (let p in temp) {
            for (let k in temp[p]) {
                let ks = Object.keys(temp[p][k]),
                    duplicate = false;
                if (ks.length == 1) duplicate = true;
                if (ks.map(v => temp[p][k][v]).filter((v, i, l) => l.indexOf(v) == i).length == 1) duplicate = true;
                if (duplicate) temp[p][k] = temp[p][k][ks[0]];
            }
            let ps = Object.keys(temp[p]);
            if (ps.map(v => temp[p][v]).filter((v, i, l) => l.indexOf(v) == i).length == 1) temp[p] = temp[p][ps[0]]
        }
        result.push(temp)
    }
    return result;
}

module.exports = search;