// https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/HKO_open_data_10min_wind_Documentation.pdf

const moment = require("../../../moment");
const cmn = require("../../../common");
const BASE_URL = " https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_10min_wind{lang}.csv";
const UnitValue = require("../../../_class").UnitValue;
const HKOStation = require("../../../_class").HKOStation;
const Direction = require("../../../_class").Direction;

const VALID = {
    lang: /^(|_uc|_sc)$/,
};
const VALID_OPT = {
    station: /^[A-Z0-9]{2,3}$/,
};
const PARAMS = {
    lang: "en",
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                en: "",
                tc: "_uc",
                sc: "_sc"
            }
        },
    }
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        hasStation = true;

    if ("station" in params) {
        hasStation = !cmn.HasDataJson("stations") || cmn.SearchDataJson("stations", {
            "type": "a",
            "code": params.station
        }).length != 0;
        if (!hasStation) {
            result.error = true;
            result.message = "Invalid station code";
        }
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
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, params))
                .then((res) => {
                    resolve(processData(res, opts));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    return data.body.map(row => {
            if (row[2] === "N/A" || row[2].trim() === "") return false;
            let date = moment(row[0], "YYYYMMDDHHmm"),
                winddirection;
            try {
                winddirection = new Direction(row[2]);
            } catch (e) {
                winddirection = row[2];
            }

            let temp = {
                station: new HKOStation({
                    name: row[1],
                    type: "a"
                }, "w"),
                date: date.format("YYYY-MM-DD"),
                time: date.format("HH:mm"),
                winddirection,
            }
            if (row[3] !== "N/A" && row[3] !== "") {
                temp.mean = new UnitValue({
                    type: "speed",
                    category: "kmh",
                    value: row[3],
                })
            }
            if (row[4] !== "N/A" && row[4] !== "") {
                temp.max = new UnitValue({
                    type: "speed",
                    category: "kmh",
                    value: row[4],
                })
            }
            return temp;
        })
        .filter(row => row && (!opts.station || row.station.code === opts.station))
}

module.exports = search;