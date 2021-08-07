// https://data.weather.gov.hk/weatherAPI/doc/HKO_Open_Data_API_Documentation.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "https://data.weather.gov.hk/weatherAPI/opendata/opendata.php";
const UnitValue = require("../../_class").UnitValue;
const HKOStation = require("../../_class").HKOStation;

const VALID = {
    dataType: /^(HHOT|HLT|SRS|MRS|LHL|LTMV)$/,
    rformat: /^(json|csv)$/,
};
const VALID_OPT = {
    year: /^[0-9]{4}$/,
    month: /^[0-9]{1,2}$/,
    day: /^[0-9]{1,2}$/,
    hour: /^[0-9]{1,2}$/,
    station: /^[A-Z0-9]{2,3}$/,
    lang: /^(en|tc|sc)$/
};
const PARAMS = {
    dataType: "HHOT",
    rformat: "json",
}
const SEARCH_CONFIG = {
    value: {
        type: {
            name: "dataType",
            accepted: ["HHOT", "HLT", "SRS", "MRS", "LHL", "LTMV"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        hasStation = true;
    for (let key in params) {
        if (params.dataType == "LHL" || params.dataType == "LTMV") {
            if (["dataType", "rformat", "lang"].indexOf(key) == -1) delete params[key];
        } else if (params.dataType == "MRS" || params.dataType == "SRS") {
            if (key == "hour" || key == "station") delete params[key];
        }
    }

    if ("station" in params) {
        hasStation = !cmn.HasDataJson("stations") || cmn.SearchDataJson("stations", {
            "a": 1,
            "code": params.station
        }).length != 0;
        if (!hasStation) {
            result.error = true;
            result.message = "Invalid station code";
        }
    } else if (params.dataType == "HHOT") {
        result.error = true;
        result.message = "Missing station code";
    }
    if (!("year" in params) && "month" in params) delete params.month;
    if (!("month" in params) && "day" in params) delete params.day;
    if (!("day" in params) && "hour" in params) delete params.hour;

    if (!("lang" in params) && (params.dataType == "LHL" || params.dataType == "LTMV")) {
        result.error = true;
        result.message = "Missing parameter: lang";
    }

    if ("year" in params) {
        let y = parseInt(params.year),
            m = parseInt(params.month) || 1,
            d = parseInt(params.day) || 1,
            h = parseInt(params.hour) || 1,
            date = moment([y, m - 1, d, h]),
            after = moment([params.dataType == "HHOT" || params.dataType == "HLT" ? 2019 : 2018]),
            before = moment([moment().year() + 3]);
        if (!(date.isValid() && date.isBetween(after, before, "d", "[)"))) {
            result.error = true;
            result.message = "Invalid `year`, `month`, `day` or `hour`";
        }
    } else if (params.dataType != "LHL" && params.dataType != "LTMV") {
        result.error = true;
        result.message = "Missing parameter: year";
    }

    if (!result.error) {
        result.data = {
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
            opts = {
                ...opts,
                ...params
            };
            cmn.APIRequest(BASE_URL, params)
                .then((res) => {
                    resolve(processData(res, opts));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let temp = {},
        type = opts.dataType,
        time, startTime, endTime,
        result;
    if (type == "LHL") {
        time = data.data[0][0];
        startTime = moment(time.split("-")[0], "YYYYMMDDHHmm").format("HH:mm")
        endTime = moment(time.split("-")[1], "YYYYMMDDHHmm").format("HH:mm")
    } else if (type == "LTMV") {
        time = moment(data.data[0][0], "YYYYMMDDHHmm").format("HH:mm")
    }
    data.data.map((row) => {
        let match = true,
            m, d, date;
        if (type == "LHL" || type == "LTMV") row.shift()
        if (type == "HHOT" || type == "HLT" || type == "LHL") {
            m = row.shift();
            d = row.shift();
            if ("month" in opts) match = match && parseInt(m) == parseInt(opts.month);
            if ("day" in opts) match = match && parseInt(d) == parseInt(opts.day);
            if (match) {
                if (!(m in temp)) temp[m] = {}
                if (!(d in temp[m])) temp[m][d] = {}
            }
        } else if (type == "SRS" || type == "MRS") {
            date = row.shift();
            m = date.split("-")[1];
            d = date.split("-")[2];
            if (!(m in temp)) temp[m] = {}
        }
        if (match) {
            if (type == "HHOT") {
                row.map((v, i) => {
                    let h = data.fields[i + 2];
                    if (!("hour" in opts) || ("hour" in opts && h == opts.hour)) {
                        temp[m][d][`${h}00`] = new UnitValue({
                            type: "length",
                            category: "metre",
                            value: v
                        })
                    }
                })
            } else if (type == "HLT") {
                row.filter(v => v != "").map((v, i, l) => {
                    if (i % 2 == 1) {
                        temp[m][d][l[i - 1]] = new UnitValue({
                            type: "length",
                            category: "metre",
                            value: v
                        })
                    }
                })
            } else if (type == "SRS" || type == "MRS") {
                temp[m][d] = {
                    rise: row[0],
                    tran: row[1],
                    set: row[2],
                }
            } else if (type == "LHL") {
                temp[m][d] = parseInt(row[0]);
            } else if (type == "LTMV") {
                temp[row[0]] = new UnitValue({
                    type: "length",
                    category: "metre",
                    value: parseInt(row[1]),
                    scale: "kilo"
                });
            }
        }
    })

    if (type == "HHOT" || type == "HLT") {
        result = [];
        for (let m in temp) {
            for (let d in temp[m]) {
                let set = {
                    date: `${opts.year}-${m}-${d}`,
                    data: []
                }
                for (let t in temp[m][d]) {
                    set.data.push({
                        time: t.replace(/(\d\d)(\d\d)/, '$1:$2'),
                        height: temp[m][d][t]
                    })
                }
                result.push(set)
            }
        }
        if (result.length == 1) result = result[0]
    } else if (type == "SRS" || type == "MRS") {
        result = [];
        for (let m in temp) {
            for (let d in temp[m]) {
                let set = {
                    date: `${opts.year}-${m}-${d}`,
                }
                for (let key in temp[m][d]) {
                    set[(type == "SRS" ? "sun" : "moon") + key] = temp[m][d][key];
                }
                result.push(set)
            }
        }
    } else if (type == "LHL") {
        result = {
            period: `${startTime}-${endTime}`,
            data: []
        }
        for (let t in temp) {
            for (let p in temp[t]) {
                result.data.push({
                    type: t,
                    region: p,
                    count: temp[t][p]
                })
            }
        }
    } else if (type == "LTMV") {
        result = {
            time: time,
            data: []
        };
        for (let p in temp) {
            result.data.push({
                station: new HKOStation(p),
                visibility: temp[p]
            })
        }
    }
    return result;
}

module.exports = search