// https://www.ha.org.hk/opendata/Data-Specification-for-SOP-Waiting-Time-tc.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "https://www.ha.org.hk/opendata/sop/sop-waiting-time-{lang}.json";

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
    let result = {};
    data.map(item => {
        if (!(item.specialty in result)) result[item.specialty] = {};
        let type = item.Category.split(" - ");
        if (!(type[0] in result[item.specialty])) result[item.specialty][type[0]] = {}
        if (type[1]) {
            if (!(type[1] in result[item.specialty][type[0]])) result[item.specialty][type[0]][type[1]] = {}
            result[item.specialty][type[0]][type[1]][item.cluster] = item.Value;
        } else if (type[0] == item.Description) {
            let date = moment(item.Value, "LL")
            if (!date.isValid()) {
                date = moment(item.Value, "DD MMMM YYYY", "en")
            }
            result[item.specialty][type[0]] = date.format("YYYY-MM-DD");
        } else {
            result[item.specialty][type[0]][item.Description] = item.Value;
        }
    })
    return result;
}

module.exports = search