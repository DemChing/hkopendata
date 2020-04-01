// https://www.ha.org.hk/opendata/Data-Specification-for-A&E-Waiting-Time-tc.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "https://www.ha.org.hk/opendata/aed/aedwtdata-{lang}.json";

const VALID = {
    lang: /^(en|tc|sc)$/,
};
const PARAMS = {
    lang: "en",
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
        let processed = validateParameters({
            ...PARAMS,
            ...data
        });
        if (processed.error) {
            reject(processed);
        } else {
            cmn.APIRequest(cmn.ReplaceURL(BASE_URL, processed.data))
                .then((res) => {
                    resolve(processData(res, opts))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let lastUpdate = moment(data.updateTime, ["LLL", "DD/MM/YYYY HH:mma"]).format("YYYY-MM-DD HH:mm");
    return data.waitTime.map(v => {
        return {
            hospital: v.hospName,
            waitingTime: v.topWait,
            lastUpdate
        }
    })
}

module.exports = search