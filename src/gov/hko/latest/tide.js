// https://data.weather.gov.hk/weatherAPI/hko_data/tide/File_layout_for_latest_tides_en.pdf

const cmn = require("../../../common");
const BASE_URL = "https://data.weather.gov.hk/weatherAPI/hko_data/tide/ALL_{lang}.csv";
const UnitValue = require("../../../_class").UnitValue;
const HKOStation = require("../../../_class").HKOStation;

const VALID = {
    lang: /^(en|tc|sc)$/,
};
const VALID_OPT = {
    station: /^[A-Z0-9]{2,3}$/,
};
const PARAMS = {
    lang: "en",
}

function validateParameters(params) {
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        hasStation = true;

    if ("station" in params) {
        hasStation = !cmn.HasDataJson("stations") || cmn.SearchDataJson("stations", {
            "type": "t",
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
            if (row[3] === "N/A" || row[3].trim() === "") return false;
            return {
                station: new HKOStation({
                    name: row[0],
                    type: "t"
                }),
                date: row[1],
                time: row[2],
                height: new UnitValue({
                    type: "length",
                    category: "metre",
                    value: row[3]
                })
            }
        })
        .filter(row => row && (!opts.station || row.station.code === opts.station))
}

module.exports = search;