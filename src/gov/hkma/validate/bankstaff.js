// https://apidocs.hkma.gov.hk/chi/documentation/bank-svf-info/hotlines-auth-retailbanks-rep/

const cmn = require("../../../common");
const lib = require("../../../lib/gov-hkma");
const BASE_URL = "https://api.hkma.gov.hk/public/bank-svf-info/hotlines-auth-retailbanks-rep";

const VALID = {
    lang: /^(en|tc)$/,
}
const PARAMS = {
    lang: "en",
}
const RENAME = {
    "retailbank_name": "organization",
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
    data = lib.RenameAll(data, RENAME);
    data.map(item => {
        let temp = {},
            hotlines = {};
        for (let key in item) {
            let m;
            if (m = key.match(/(tel|remarks)(\d)/)) {
                if (!(m[2] in hotlines)) hotlines[m[2]] = {};
                hotlines[m[2]][m[1]] = item[key].trim();
            } else temp[key] = item[key];
        }
        temp.hotline = Object.keys(hotlines).map(v => hotlines[v])
        result.push(temp)
    })
    return result;
}

module.exports = search