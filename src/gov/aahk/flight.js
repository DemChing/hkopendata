// https://www.hongkongairport.com/iwov-resources/misc/opendata/Flight_Information_DataSpec_en.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const Flight = require("../../_class").Flight;
const BASE_URL = "https://www.hongkongairport.com/flightinfo-rest/rest/flights/past";

const VALID = {
    date: /^[0-9]{4}-[0-9]+-[0-9]+$/,
    arrival: /^(true|false)$/,
    cargo: /^(true|false)$/,
    lang: /^(en|zh_HK|zh_CN)$/
};
const PARAMS = {
    date: moment().format("YYYY-MM-DD"),
    arrival: true,
    cargo: true,
    lang: "en"
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                tc: "zh_HK",
                sc: "zh_CN"
            }
        }
    },
    boolean: ["arrival", "cargo"]
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);
    if ("date" in params) {
        let date = moment(params.date).startOf("d"),
            after = moment().subtract(91, "d").startOf("d"),
            before = moment().add(14, "d").startOf("d")
        if (!(date.isValid() && date.isBetween(after, before, "d", "[]"))) {
            result.error = true;
            result.message = "Invalid date. Format: YYYY-MM-DD, Range: -91 days to +14 days."
        }
        params.date = date.format("YYYY-MM-DD");
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
    data.map((item) => {
        let temp = {
            date: item.date,
            arrival: item.arrival,
            cargo: item.cargo,
        }
        item.list.map((flight, i) => {
            if (typeof opts === "undefined" || cmn.MatchData(flight, opts, true)) {
                result.push({
                    ...temp,
                    ...flight
                })
            }
        })
    })
    result = result.map((flight) => new Flight(flight));
    return result;
}

module.exports = search