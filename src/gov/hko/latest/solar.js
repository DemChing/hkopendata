// https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/HKO_open_data_solar_radiation_Documentation.pdf

const moment = require("../../../moment");
const cmn = require("../../../common");
const BASE_URL = "https://data.weather.gov.hk/weatherAPI/hko_data/regional-weather/latest_1min_solar{lang}.csv";
const UnitValue = require("../../../_class").UnitValue;
const HKOStation = require("../../../_class").HKOStation;

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
            let keys = ["global", "direct", "diffuse"],
                date = moment(row.shift(), "YYYYMMDDHHmm"),
                station = new HKOStation({
                    name: row.shift(),
                    type: "a"
                }),
                data = {};
            row.map((v, i) => {
                if (v !== "N/A" && v !== "") {
                    data[keys[i] + "Radiation"] = new UnitValue({
                        type: "flux",
                        category: "wm",
                        value: v
                    });
                }
            })
            if (Object.keys(data).length === 0) return false;
            return {
                station,
                date: date.format("YYYY-MM-DD"),
                time: date.format("HH:mm"),
                ...data
            }
        })
        .filter(row => row && (!opts.station || row.station.code === opts.station))
}

module.exports = search;