// https://www.hydro.gov.hk/datagovhk/Latest_Tide_Information_EN.pdf

const cmn = require("../../../common");
const BASE_URL = " https://tide1.hydro.gov.hk/hotide/OpenData/All_{lang}.csv";
const UnitValue = require("../../../_class").UnitValue;

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
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, processed.data))
                .then((res) => {
                    resolve(processData(res));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    return data.body.map(row => {
            if (row[3] === "---") return false;
            return {
                station: row[0],
                date: row[1],
                time: row[2],
                height: new UnitValue({
                    type: "length",
                    category: "metre",
                    value: row[3]
                })
            }
        })
        .filter(row => row)
}

module.exports = search;