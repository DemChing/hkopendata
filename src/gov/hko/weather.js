// https://data.weather.gov.hk/weatherAPI/doc/HKO_Open_Data_API_Documentation.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const UnitValue = require("../../_class").UnitValue;
const BASE_URL = "https://data.weather.gov.hk/weatherAPI/opendata/weather.php";

const VALID = {
    dataType: /^(flw|fnd|rhrread|warnsum|warningInfo|swt)$/,
    lang: /^(en|tc|sc)$/
};
const PARAMS = {
    dataType: "flw",
    lang: "en"
}
const UNIT_VALUES = {
    "C": {
        type: "temperature",
        category: "celsius"
    },
    "percent": {
        type: "ratio",
        category: "percent"
    },
    "metre": {
        type: "length",
        category: "metre"
    },
    "mm": {
        type: "length",
        category: "metre",
        scale: "milli"
    },
}
const FIELDS = {
    others: {
        "icon": "_icon",
        "updateTime": "lastUpdate",
        "iconUpdateTime": "_iconLastUpdate",
        "main": "maintenance"
    }
}
const SEARCH_CONFIG = {
    value: {
        type: {
            name: "dataType",
            accepted: ["flw", "fnd", "rhrread", "warnsum", "warningInfo", "swt"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);
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
            cmn.APIRequest(BASE_URL, params)
                .then((res) => {
                    resolve(processData(res));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    if (typeof data !== "object" || data === null || Object.keys(data).length == 0) return data;
    let unitValueKey;
    if (("value" in data || "max" in data || "min" in data) && "unit" in data) {
        let arr = ["value", "max", "min"],
            unitValue = {
                ...UNIT_VALUES[data.unit]
            };
        arr.map(v => {
            if (v in data) {
                unitValue.value = data[v];
                if (v == "value") {
                    unitValueKey = unitValue.type;
                    delete data[v]
                } else {
                    unitValueKey = v;
                }
            }
        })
        data[unitValueKey] = new UnitValue(unitValue);
        delete data.unit;
    }
    for (let key in data) {
        let m;
        if (key.indexOf("Time") != -1) {
            data[key] = moment(data[key]).format("YYYY-MM-DD HH:mm")
        } else if (key == "forecastDate") {
            data[key] = moment(data[key]).format("YYYY-MM-DD")
        }
        if (Array.isArray(data[key])) {
            data[key] = data[key].map(v => processData(v))
        } else if (typeof data[key] === "object" && !data[key].toLocale) {
            data[key] = processData(data[key]);
        }

        if (m = key.toCamelCase().match(/forecast(\w+)/)) {
            let k = m[1].toCamelCase();
            if (k == "date") {
                data[k] = data[key];
            } else {
                if (!("forecast" in data)) data.forecast = {}
                data.forecast[k == "icon" ? "_icon" : k] = data[key];
            }
            delete data[key]
        }
    }
    if ("main" in data) {
        data.main = data.main != "FALSE";
    }
    if ("startTime" in data && "endTime" in data) {
        data.period = `${data.startTime}-${data.endTime}`;
        delete data.startTime;
        delete data.endTime;
    }

    if (Object.keys(data).filter(v => v != "value").length == 0) return data.value;
    if (Object.keys(data).filter(v => v != unitValueKey).length == 0) return data[unitValueKey];

    return cmn.RenameFields(data, FIELDS);
}

module.exports = search