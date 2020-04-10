// https://www.chp.gov.hk/files/pdf/nid_spec_en.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "http://www.chp.gov.hk/files/misc/{type_url}.csv";

const PACKAGE = {
    stat: {
        dataKey: "date",
        url: "latest_situation_of_reported_cases_wuhan_{lang}",
        cols: ["lastUpdate", "confirmed", "ruledOut", "hospitalised", "reporting", "death", "discharge", "probable", "critical"]
    },
    case: {
        dataKey: "caseNo",
        url: "enhanced_sur_pneumonia_wuhan_{lang}",
        cols: ["confirmDate", "onsetDate", "gender", "age", "hospital", "state", "hkResident", "class"]
    },
    building: {
        dataKey: "buildingId",
        url: "building_list_{lang}",
        cols: ["district", "building", "lastStayingDate", "relatedCases"]
    },
    transport: {
        dataKey: "transportId",
        url: "flights_trains_list_{lang}",
        cols: ["transportNo", "route", "travelDate", "relatedCases"]
    },
    quarantineA: {
        dataKey: "caseNo",
        url: "building_list_home_confinees_{lang}",
        cols: ["district", "building", "endQuarantineDate"]
    },
    quarantineC: {
        dataKey: "caseNo",
        url: "home_confinees_tier2_building_list",
        cols: ["district", "building", "endQuarantineDate"]
    },
}
const VALID = {
    lang: /^(eng|chi)$/,
    type: /^(stat|case|building|transport|quarantineA|quarantineC)$/,
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
            accepted: ["stat", "case", "building", "transport", "quarantineA", "quarantineC"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);
    if (!result.error) {
        result.data = {
            ...{
                type_url: PACKAGE[params.type].url
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
        });
        if (processed.error) {
            reject(processed);
        } else {
            opts = opts || {};
            opts.lang = processed.data.lang;
            opts.type = processed.data.type;
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, processed.data))
                .then((res) => {
                    resolve(processData(res, opts))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let body = data.body,
        type = opts.type,
        dataKey = PACKAGE[type].dataKey,
        result = [],
        temp = {},
        formatDate = (v) => {
            let d = moment(v, "DD/MM/YYYY");
            return d.isValid() ? d.format("YYYY-MM-DD") : v;
        },
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

    body.map((row, i) => {
        if (type == "stat") {
            let key = row.shift();
            key = formatDate(key);
            row = row.map((v, i) => {
                if (i == 0) return `${key} ${v}`
                else return v == "" ? "N/A" : parseInt(v)
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
            if (/quarantine/.test(type)) row.shift();
            if (type == "quarantineC") {
                row[0] = row[0].split(" ")[opts.lang == "chi" ? 0 : 1];
                row[1] = row[1].split(/\r?\n/)[opts.lang == "chi" ? 0 : 1];
            }
            row[2] = formatDate(row[2]);
            temp[i + 1] = row;
        }
    })
    
    for (let key in temp) {
        PACKAGE[type].cols.map((v, i) => {
            if (!(key in processed)) processed[key] = {};
            processed[key][v] = temp[key][i];
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
    
    return result;
}

module.exports = search