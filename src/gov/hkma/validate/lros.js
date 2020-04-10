// https://apidocs.hkma.gov.hk/chi/documentation/bank-svf-info/register-ais-lros/

const cmn = require("../../../common");
const lib = require("../../../lib/gov-hkma");
const BASE_URL = "https://api.hkma.gov.hk/public/bank-svf-info/register-ais-lros";

const VALID = {
    lang: /^(en|tc)$/,
}
const PARAMS = {
    lang: "en",
}
const FIELDS = {
    "local_address" :"businessAddress",
    "principle_address" :"businessOverseaAddress",
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
    return data && data.length > 0 ? lib.RenameAll(data, FIELDS) : [];
}

module.exports = search