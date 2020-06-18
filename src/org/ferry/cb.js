// https://www.mardep.gov.hk/datagovhk/Dataspec_crossboundary_ferry_services_arrive_depart_en.pdf
const cmn = require("../../common");
const BASE_URL = "https://www.mardep.gov.hk/e_files/{langDir}/opendata/{dir}_{lang}.csv";
const FERRY = cmn.GetDataJson("hk-ferry");

const VALID = {
    dir: /^(arrival|depart)$/,
    lang: /^(en|tc|sc)$/,
}
const PARAMS = {
    dir: "arrival",
    lang: "en"
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                tc: "tc",
                sc: "sc",
                en: "en"
            }
        },
        dir: {
            accepted: ["arrival", "depart"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);

    if (!result.error) {
        result.data = {
            ...{
                langDir: params.lang == "tc" ? "hk" : params.lang
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
            }),
            params;
        if (processed.error) {
            reject(processed);
        } else {
            params = processed.data;
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, params), {
                    delimiter: "|"
                })
                .then((res) => {
                    resolve(processData(res, params))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, params) {
    return data.body.map(row => {
        let temp = {
            company: row[2],
            time: row[0],
            berth: row[4],
            pier: row[3],
        }
        if ("pier" in FERRY) {
            FERRY.pier.map(pier => {
                for (let k in pier) {
                    if (pier[k] === temp.pier) {
                        temp.pier = pier.loc;
                    }
                }
            })
        }
        if ("company" in FERRY) {
            FERRY.company
                .filter(com => "abbr" in com)
                .map(com => {
                    if (com.abbr.indexOf(temp.company) != -1) {
                        temp.company = com;
                        temp.companyCode = com.code;
                    }
                })
        }
        temp[params.dir == "depart" ? "destination" : "origin"] = row[1];
        if (/cancel|取消/i.test(row[5])) {
            temp.cancelled = true;
        } else if (/depart|開航|开航/i.test(row[5])) {
            temp.departed = true;
        } else if (/delay|延遲|延迟/i.test(row[5])) {
            temp.delayed = true;
        }
        return temp;
    })
}

module.exports = search;