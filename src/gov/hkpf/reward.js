// https://theme.gov.hk/en/theme/psi/datasets/data_specification_for_wanted_persons_with_reward_notices.pdf

const cmn = require("../../common");
const BASE_URL = "https://www.police.gov.hk/info/appeals_public/{url}_{lang}.xml";

const PACKAGE = {
    w: {
        url: "wanted_persons/w",
        key: "wantedPersons"
    },
    orn: {
        url: "other_reward_notice/orn",
        key: "otherRewardNotices"
    }
}
const VALID = {
    lang: /^(en|tc|sc)$/,
    type: /^(w|orn)$/,
};
const PARAMS = {
    lang: "en",
    type: "w"
}
const FIELDS = {
    text: {
        "id": "_id",
        "title": "type",
        "mdate": "validUntil",
        "url": "website",
        "other": "detail",
        "revisedDate": "lastUpdate",
    }
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["w", "orn"]
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);
    if (!result.error) {
        if (params.type in PACKAGE) params.url = PACKAGE[params.type].url;
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
            cmn.XMLFetch(cmn.ReplaceURL(BASE_URL, processed.data), {}, {
                    parseAttributeValue: true,
                    ignoreAttributes: false,
                    attributeNamePrefix: "",
                })
                .then((res) => {
                    resolve(processData(res, processed.data))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    opts = opts || {};
    const host = "https://www.police.gov.hk";
    let result = [],
        lang = opts.lang || "en",
        type = opts.type || "w";
    data[PACKAGE[type].key].case.map(item => {
        let temp = {}
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            if (key == "website") {
                temp[key] = `${host}/ppp_${lang}/06_appeals_public/missing/${item[key]}`;
            } else if (key == "reward") {
                let amount = item[key],
                    m = amount.match(/HK\$([0-9,]+)/);
                if (!m) m = amount.match(/([0-9,]+)/);
                if (m) {
                    amount = parseFloat(m[1].replace(/[^0-9]/g, ""));
                }
                temp[key] = amount;
            } else if (key == "validUntil") {
                let date = item[key],
                    m = date.match(/(\d{4}.\d{1,2}.\d{1,2})/);
                if (m) {
                    date = m[1].replace(/[^0-9]/g, "-");
                }
                temp[key] = date;
            } else if (key == "detail") {
                let val = item[key].replace(/\n|\t/g, "");
                temp[key] = val.split(/<[A-z]+[^>]*\/?>/).map(v => v.replace(/<\/?[A-z]+[^>]*>/g, "").trim()).filter(v => v != "");
            } else if (key == "item") {
                let persons = item[key];
                if (!Array.isArray(persons)) persons = [persons];
                temp.persons = persons.map(v => {
                    let t = {
                        name: v.name,
                    };
                    if ("nameDesc" in v) t.description = v.nameDesc.trimChar(" :");
                    if ("img" in v) t.images = [`${host}${v.img.replace(/\s/g, "%20")}`];
                    return t;
                })
            } else {
                temp[key] = item[key];
            }
        }
        result.push(temp)
    })
    return result;
}

module.exports = search;