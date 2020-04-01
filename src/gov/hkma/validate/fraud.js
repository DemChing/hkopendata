// https://apidocs.hkma.gov.hk/chi/documentation/bank-svf-info/fraudulent-bank-scams/

const cmn = require("../../../common");
const lib = require("../../../lib/gov-hkma");
const BASE_URL = "https://api.hkma.gov.hk/public/bank-svf-info/fraudulent-bank-scams";

const VALID = {
    lang: /^(en|tc)$/,
}
const PARAMS = {
    lang: "en",
}
const RENAME = {
    "alleged_name": "organization",
    "scam_type": "type",
    "pr_url": "website",
    "fraud_website_address": "fraudWebsites",
    "issue_date": "date"
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
    const fraudParse = {
            "hXXp": /http/gi,
            ".cXm": /\.com/gi,
            "*": /\./g,
        },
        fraudRevert = {
            "http": /hxxp/gi,
            "$1": /\[([:.])\]/g,
            "": /\s/g,
        }
    data = lib.RenameAll(data, RENAME);
    data.map(item => {
        let temp = {};
        for (let key in item) {
            if (key == "fraudWebsites") {
                temp[key] = [];
                temp[`_${key}`] = [];
                if (item[key]) {
                    item[key].split(";").map(v => {
                        let t = v;
                        for (let k in fraudRevert) {
                            t = t.replace(fraudRevert[k], k)
                        }
                        temp[`_${key}`].push(t);
                        for (let k in fraudParse) {
                            t = t.replace(fraudParse[k], k)
                        }
                        temp[key].push(t);
                    })
                }
            } else temp[key] = item[key];
        }
        result.push(temp)
    })
    return result;
}

module.exports = search