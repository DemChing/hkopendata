// https://www.chp.gov.hk/files/pdf/nid_spec_en.pdf

const moment = require("../../moment");
const fs = require("fs");
const cmn = require("../../common");
const BASE_URL = "http://www.chp.gov.hk/files/misc/{type_url}_{lang}.csv";
let WARS = {};
try {
    WARS = require("../../../data/wars.json");
} catch (e) {}

const PACKAGE = {
    stat: {
        dataKey: "date",
        url: "latest_situation_of_reported_cases_wuhan",
        cols: ["lastUpdate", "confirmed", "ruledOut", "hospitalised", "reporting", "death", "discharge"]
    },
    case: {
        dataKey: "caseNo",
        url: "enhanced_sur_pneumonia_wuhan",
        cols: ["confirmDate", "onsetDate", "gender", "age", "hospital", "state", "hkResident", "class"]
    },
    building: {
        dataKey: "buildingId",
        url: "building_list",
        cols: ["district", "building", "lastStayingDate", "relatedCases"]
    },
    transport: {
        dataKey: "transportId",
        url: "flights_trains_list",
        cols: ["transportNo", "route", "travelDate", "relatedCases"]
    },
    quarantine: {
        dataKey: "caseNo",
        url: "building_list_home_confinees",
        cols: ["district", "building", "endQuarantineDate"]
    }
}
const VALID = {
    lang: /^(eng|chi)$/,
    type: /^(stat|case|building|transport|quarantine)$/,
};
const PARAMS = {
    lang: "eng",
    type: "stat"
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                tc: "chi",
                en: "eng"
            }
        },
        type: {
            accepted: ["stat", "case", "building", "transport", "quarantine"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);
    if (!result.error) {
        result.data = {
            ...params
        }
        result.data.type_url = PACKAGE[result.data.type].url;
    }
    return result;
}

function search(data, opts) {
    return new Promise((resolve, reject) => {
        let processed = validateParameters({
            ...PARAMS,
            ...data
        });
        if (processed.error) {
            reject(processed);
        } else {
            let type = processed.data.type,
                hasResult = false;
            opts = opts || {};
            opts.type = type;
            if (type in WARS) {
                if (type == "stat") {
                    if (("date" in opts && opts.date in WARS[type])) {
                        hasResult = true;
                    }
                } else if (type == "case") {
                    if ("caseNo" in opts && opts.caseNo in WARS[type]) {
                        hasResult = true;
                    }
                }
            }
            if (!hasResult) {
                cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, processed.data))
                    .then((res) => {
                        resolve(processData(res, opts))
                    })
                    .catch((err) => reject(err))
            } else {
                resolve(queryResult(opts))
            }
        }
    })
}

function processData(data, opts) {
    let body = data.body,
        type = opts.type,
        result = {},
        temp = {},
        update = false,
        formatDate = (v) => {
            return moment(v, "DD/MM/YYYY").format("YYYY-MM-DD");
        };

    body.map((row, i) => {
        if (type == "stat") {
            let key = row.shift();
            key = formatDate(key);
            row = row.map((v, i) => {
                if (i == 0) return `${key} ${v}`
                else return parseInt(v)
            })
            temp[key] = row;
        } else if (type == "case") {
            let key = row.shift();
            row = row.map((v, i) => {
                if (i < 2) return formatDate(v)
                else if (i == 3) return parseInt(v)
                return v;
            })
            temp[key] = row;
        } else if (/building|transport|quarantine/.test(type)) {
            if (type == "quarantine") row.shift();
            row[2] = formatDate(row[2]);
            temp[i + 1] = row;
        }
    })
    result = {
        ...temp
    }

    if (!(type in WARS)) {
        WARS[type] = result;
        update = true;
    } else {
        for (let key in result) {
            if (!(key in WARS[type])) {
                WARS[type][key] = result[key]
                update = true;
            }
        }
    }
    if (update) {
        fs.writeFile("data/wars.json", JSON.stringify(WARS), (err) => {});
    }
    return queryResult(opts);
}

function queryResult(opts) {
    let type = opts.type,
        dataKey = PACKAGE[type].dataKey,
        result = [],
        processed = {},
        addResult = (key) => {
            let temp = {};
            temp[dataKey] = key;
            temp = {
                ...temp,
                ...processed[key]
            };
            result.push(temp)
        };
    for (let key in WARS[type]) {
        PACKAGE[type].cols.map((v, i) => {
            if (!(key in processed)) processed[key] = {};
            processed[key][v] = WARS[type][key][i];
        })
    }

    if (dataKey in opts) {
        if (opts[dataKey] in processed) {
            addResult(opts[dataKey])
        }
    } else {
        let matched = Object.keys(processed).filter(index => {
            let match = true;
            for (let key in opts) {
                if (key in processed[index]) {
                    match = match && processed[index][key] == opts[key]
                }
            }
            return match
        })
        if (matched.length > 0) {
            matched.map(key => addResult(key))
        }
    }
    return result
}

module.exports = search