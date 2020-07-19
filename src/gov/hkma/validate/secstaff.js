// https://apidocs.hkma.gov.hk/chi/documentation/bank-svf-info/register-ais-secstaff/

const cmn = require("../../../common");
const lib = require("../../../lib/gov-hkma");
const BASE_URL = "https://api.hkma.gov.hk/public/bank-svf-info/register-ais-secstaff";

const VALID = {
    lang: /^(en|tc)$/,
    searchtype: /^(engName|chiName|regNo)$/,
    is_curr_rel_indiv: /^(0|1)$/,
}
const VALID_OPT = {
    surname: /^[A-z ]+$/,
    forename: /^[A-z ]+$/,
    chinesename: /^.+$/,
    reg_code: /^[A-z0-9]+$/,
}
const PARAMS = {
    lang: "en",
}
const FIELDS = {
    "reg_code" :"hkmaRegCode",
    "reg_act": "regulatedActivity",
    "eng_first_date": "firstDateEngage",
    "capacity": "positionTitle",
}
const SEARCH_CONFIG = {
    value: {
        type: {
            name: "searchtype",
            accepted: ["engName", "chiName", "regNo"]
        },
        former: {
            name: "is_curr_rel_indiv",
            accepted: {
                false: 0,
                true: 1,
            }
        }
    },
    rename: {
        code: "reg_code",
        chineseName: "chinesename",
    }
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (params.searchtype == "engName" && !("surname" in params) && !("forename" in params)) {
        result.error = true;
        result.message = "Missing parameter: surname/forename";
    }
    if (params.searchtype == "chiName" && !("chinesename" in params)) {
        result.error = true;
        result.message = "Missing parameter: chinesename";
    }
    if (params.searchtype == "regNo" && !("reg_code" in params)) {
        result.error = true;
        result.message = "Missing parameter: reg_code";
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
        let processed = lib.validateParameters({
                ...PARAMS,
                ...data
            }, validateParameters, true),
            params;
        if (processed.error) {
            reject(processed);
        } else {
            params = processed.data;
            lib.APIRequest(BASE_URL, params)
                .then((res) => {
                    resolve(processData(res));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let result = [];
    data = lib.RenameAll(data, FIELDS);
    data.map(item => {
        let temp = {};
        for (let key in item) {
            if (/^(name|nameTc)$/.test(key)) {
                if (!("name" in temp)) temp.name = {};
                temp.name[key == "name" ? "en" : "tc"] = item[key];
            } else if (/^(currentRegistration|registrationHistory|recPubDisActBySfc|recPubDisActByHkma)/.test(key)) {
                temp[key] = item[key].map(v => {
                    let t = {};
                    for (let k in v) {
                        if (/^(firstDateEngage|effectiveDate|actionDate)$/.test(k)) {
                            t[k] = lib.FormatDate(v[k]);
                        } else if (k == "effectivePeriod") {
                            let dates = v[k].replace(/Since|從/, "").split("-").map(v => lib.FormatDate(v.trim()));
                            t[k] = dates.length == 1 ? `> ${dates[0]}` : dates.join(" - ");
                        } else if (k == "isEo") {
                            t[k] = v[k] != "No" && v[k] != "否";
                        } else if (v[k] !== null) {
                            t[k] = v[k];
                        }
                    }
                    return t
                })
            } else if (item[key] !== null) {
                temp[key] = item[key]
            }
        }
        result.push(temp)
    })
    return result
}

module.exports = search