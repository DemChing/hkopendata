// https://data.weather.gov.hk/weatherAPI/doc/HKO_Open_Data_API_Documentation.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "https://data.weather.gov.hk/weatherAPI/opendata/earthquake.php";
const Coordinate = require("../../_class").Coordinate;

const VALID = {
    dataType: /^(qem|feltearthquake)$/,
    lang: /^(en|tc|sc)$/
};
const PARAMS = {
    dataType: "qem",
    lang: "en"
}
const FIELDS = {
    text: {
        "updateTime": "lastUpdate",
        "ptime": "time",
    },
    latitude: ["lat"],
    longitude: ["lon"],
    number: {
        "mag": "richter"
    }
}
const SEARCH_CONFIG = {
    value: {
        type: {
            name: "dataType",
            accepted: ["qem", "feltearthquake"]
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
    let result = {}
    data = cmn.RenameFields(data, FIELDS);
    for (let key in data) {
        if (/time/i.test(key)) {
            result[key] = moment(data[key]).format("YYYY-MM-DD HH:mm")
        } else {
            result[key] = data[key]
        }
    }
    if ("coordinate" in result) {
        result.coordinate = new Coordinate(result.coordinate)
    }
    return cmn.RenameFields(result, FIELDS);
}

module.exports = search