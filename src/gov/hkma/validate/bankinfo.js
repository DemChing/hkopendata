// https://apidocs.hkma.gov.hk/chi/documentation/bank-svf-info/acctopen-banks-contact/

const cmn = require("../../../common");
const lib = require("../../../lib/gov-hkma");
const BASE_URL = "https://api.hkma.gov.hk/public/bank-svf-info/acctopen-banks-contact";

const VALID = {
    lang: /^(en|tc)$/,
}
const PARAMS = {
    lang: "en",
}
const FIELDS = {
    "bank_info_name": "organization",
}

function validateParameters(params) {
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
            let m;
            if (m = key.match(/^(pa|ba)(Service|Onlappl|Onlappo|Inforeq|Acctopenbh|Hotline|Contact)([A-z]+)$/)) {
                let type = m[1] == "pa" ? "personalAccount" : "businessAccount",
                    group = m[2].toLowerCase();
                if (!(type in temp)) temp[type] = {};
                if (!(group in temp[type])) temp[type][group] = {};
                temp[type][group][m[3].toLowerCase()] = item[key];
            } else temp[key] = item[key];
        }
        result.push(temp)
    })
    return result;
}

module.exports = search