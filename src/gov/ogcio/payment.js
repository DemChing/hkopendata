// https://www.ogcio.gov.hk/en/our_work/infrastructure/e_government/egis/egis-epay-stats-en.json

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "https://www.ogcio.gov.hk/en/our_work/infrastructure/e_government/egis/egis-epay-stats-en.json";

function search(opts) {
    return new Promise((resolve, reject) => {
        cmn.APIRequest(BASE_URL)
            .then((res) => {
                resolve(processData(res));
            })
            .catch((err) => reject(err))
    })
}

function processData(data) {
    let result = {};
    data.map((item) => {
        let y, m, d, txns = {};
        for (let key in item) {
            if (key.indexOf("Period") != -1) {
                y = moment(item[key]).format("YYYY");
                m = moment(item[key]).format("MM");
            } else if (key.indexOf("Department") != -1) {
                d = item[key];
            } else if (key.indexOf("Transaction") != -1) {
                let m;
                if (m = key.match(/(Count|Amount) - +([A-z0-9 ]+)/)) {
                    let type = m[1].toLowerCase(),
                        method = m[2].toLowerCase().replace(/\s/g, "");
                    if (!(method in txns)) txns[method] = {};
                    txns[method][type] = item[key]
                }
            }
        }
        if (!(d in result)) result[d] = {};
        if (!(y in result[d])) result[d][y] = {};
        result[d][y][m] = txns;
    })
    return result;
}

module.exports = search