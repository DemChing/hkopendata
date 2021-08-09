// https://www.aqhi.gov.hk/psi/dd/hk_currentaqhi_en.pdf

const moment = require("../../../moment");
const cmn = require("../../../common");
const BASE_URL = "https://www.aqhi.gov.hk/epd/ddata/html/out/aqhi_ind_rss_{lang}.xml";
const EPDStation = require("../../../_class").EPDStation;

const VALID = {
    lang: /^(Eng|ChT|ChS)$/,
};
const VALID_OPT = {
    station: /^[A-Z]{2,3}$/,
    type: /^(g|r)$/,
};
const PARAMS = {
    lang: "en",
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                en: "Eng",
                tc: "ChT",
                sc: "ChS"
            }
        },
        type: {
            accepted: ["g", "r"]
        },
    }
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        hasStation = true;

    if ("station" in params) {
        hasStation = !cmn.HasDataJson("aqhi") || cmn.SearchDataJson("aqhi", {
            "code": params.station
        }).length != 0;
        if (!hasStation) {
            result.error = true;
            result.message = "Invalid station code";
        }
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
        let processed = validateParameters({
                ...PARAMS,
                ...data
            }),
            params;
        if (processed.error) {
            reject(processed);
        } else {
            params = processed.data;
            opts = {
                ...opts,
                ...params
            };
            cmn.XMLFetch(cmn.ReplaceURL(BASE_URL, params))
                .then((res) => {
                    resolve(processData(res, opts));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    return data.rss.channel.item.map(row => {
            let m = row.title.match(/(.+) : (\d+) : (.+)/),
                date = moment(row.pubDate);
            return {
                station: new EPDStation(m[1]),
                date: date.format("YYYY-MM-DD"),
                time: date.format("HH:mm"),
                risk: m[3],
                value: parseInt(m[2]),
            }
        })
        .filter(row => (!opts.station || row.station.code === opts.station) && (!opts.type || row.station.type === opts.type))
}

module.exports = search;