// https://data.weather.gov.hk/weatherAPI/doc/HKO_Open_Data_API_Documentation.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const UnitValue = require("../../_class").UnitValue;
const BASE_URL = "https://data.weather.gov.hk/weatherAPI/opendata/opendata.php";

const VALID = {
    dataType: /^(CLMTEMP|CLMMAXT|CLMMINT)$/,
    rformat: /^(json|csv)$/,
    station: /^[A-z]+$/,
};
const VALID_OPT = {
    year: /^[0-9]{4}$/,
    month: /^[0-9]{1,2}$/,
};
const PARAMS = {
    dataType: "CLMTEMP",
    rformat: "json",
    station: "CCH",
}
const SEARCH_CONFIG = {
    value: {
        type: {
            name: "dataType",
            accepted: ["CLMTEMP", "CLMMAXT", "CLMMINT"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        hasStation = !cmn.HasDataJson("stations") || cmn.SearchDataJson("stations", {
            "w": 1,
            "code": params.station
        }).length != 0
    if (!hasStation) {
        result.error = true;
        result.message = "Invalid station code"
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
    let result = [];
    data.data.filter(row => {
        let match = true;
        if ("year" in opts) match = match && row[0] == opts.year;
        if ("month" in opts) match = match && row[1] == opts.month;
        if ("day" in opts) match = match && row[2] == opts.day;
        return match;
    }).map((row) => {
        let temp = {},
            station = opts.station;
        if (cmn.HasDataJson("stations")) {
            let s = cmn.SearchDataJson("stations", {
                "code": station
            })[0];
            if (s) {
                station = s.name;
            }
        }
        temp = {
            station: station,
            date: moment(`${row[0]}-${row[1]}-${row[2]}`, "YYYY-M-D").format("YYYY-MM-DD"),
            temperature: new UnitValue({
                type: "temperature",
                category: "celsius",
                value: row[3],
            }),
            completeness: row[4] == "C" ? "complete" : row[4] == "#" ? "incomplete" : "unavailable",
        }
        result.push(temp)
    })
    if (result.length == 1) result = result[0]
    return result;
}

module.exports = search