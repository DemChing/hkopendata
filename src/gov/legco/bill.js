// https://www.legco.gov.hk/datagovhk/data-dictionary-bills-db-en.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "https://app.legco.gov.hk/BillsDB/odata/Vbills";

const VALID = {};
const VALID_OPT = {
    $format: /^(json|xml)$/,
    $top: /^[0-9]+$/,
    $skip: /^[0-9]+$/,
    $orderby: /^.+$/,
    $filter: /^.+$/,
    $inlinecount: /^(allpages)$/,
    sortorder: /^(asc|desc)$/,
};
const PARAMS = {
    $format: "json",
    $top: 20,
}
const FIELDS = {
    regex: {
        "title": "name",
        "bill_content_url": "bill_gazette_website",
        "content_url": "website",
        "hansard_url": "hansard",
        "url": "website",
    },
    text: {
        "internal_key": "id",
    }
}
const SEARCH_CONFIG = {
    rename: {
        limit: "$top",
        offset: "$skip",
        sortby: "$orderby"
    }
}
const KEY_TO_NAME = {
    id: "internal_key",
    ordinance: "ordinance_title",
    bill: "bill_title",
    date: "ordinance_gazette_date",
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        substr = (name, val, lang) => {
            return `substringof('${val}',${(KEY_TO_NAME[name] || name)}${lang == "tc" ? "_chi" : lang == "en" ? "_eng" : ""})`
        };

    if (params.$orderby && !/(asc|desc)/.test(params.$orderby)) {
        let sortorder = params.sortorder || "asc";
        let name = KEY_TO_NAME[params.$orderby] || params.$orderby;
        params.$orderby = `${name} ${sortorder}`;
    }
    if (!params.$filter && params.filter) {
        let filter = [];
        for (let key in params.filter) {
            if (key == "id") {
                filter.push(substr(key, params.filter[key]));
            } else if (/^(ordinance|bill)$/.test(key)) {
                filter.push(`(${substr(key, params.filter[key], "tc")} or ${substr(key, params.filter[key], "en")})`);
            } else if (/^(from|to)^/.test(key)) {
                filter.push(`${KEY_TO_NAME.date} ${key == "from" ? "ge" : "le"} datetime'${params.filter[key]}'`);
            }
        }
        if (filter.length > 0) params.$filter = filter.join(" and ");
    }
    ["filter", "sortorder"].map(v => delete params[v]);

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
            params = processed.data;
            cmn.APIRequest(cmn.ReplaceURL(BASE_URL, processed.data), params)
                .then((res) => {
                    resolve(processData(res));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let result = [],
        arr = [],
        handle = (item) => {
            let keys = Object.keys(item);
            if (typeof item === "object" && keys.filter(v => /^\d+$/.test(v)).length > 0) {
                return keys.sort().map(v => item[v]);
            }
            return item;
        };
    data.value.map(item => {
        let temp = {};
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            let val = item[key],
                key2 = key.replace("ordinace", "ordinance");
            if (typeof val === "string") val = val.trimChar("\r\n").trim();
            if (!val) continue;
            if (/date/.test(key) && moment(val).isValid()) val = moment(val).format("YYYY-MM-DD");
            let m = key2.match(/(.+)(_(\d+))(.*)/);
            if (m) {
                let k = m[1] + (m[4] || "");
                if (!temp[k] || typeof temp[k] === "string") {
                    temp[k] = {
                        "1": temp[k]
                    }
                }
                temp[k][m[3]] = val;
            } else {
                temp[key2] = val;
            }

        }

        for (let key in temp) {
            let m;
            if (m = key.match(/(.+)_(chi|eng)/)) {
                let lang = m[2] == "chi" ? "tc" : "en";
                if (!(m[1] in temp)) temp[m[1]] = {};
                if (typeof temp[key] === "object") {
                    for (let k in temp[key]) {
                        if (!(k in temp[m[1]])) temp[m[1]][k] = {};
                        temp[m[1]][k][lang] = temp[key][k];
                    }
                } else {
                    temp[m[1]][lang] = temp[key];
                }
                delete temp[key];
            }
        }

        for (let key in temp) {
            let ckey = key.toCamelCase(),
                m;
            if (m = key.match(/^(ordinance|bill|bills_committee|legco_brief)_/)) {
                ckey = m[1].toCamelCase();
                let k = key.replace("ordinace", "ordinance").replace(`${m[1]}_`, "");
                if (!(ckey in temp)) temp[ckey] = {};
                temp[ckey][k.toCamelCase()] = temp[key];
                delete temp[key];
            } else if (m = key.match(/((first|second|third)_reading)_date(_(.+))?/)) {
                ckey = m[1].toCamelCase();
                if (!(ckey in temp)) temp[ckey] = {};
                let k = (m[4] || "date").toCamelCase();

                if (typeof temp[key] === "object" && Object.keys(temp[key]).filter(v => /^\d+$/.test(v)).length > 0) {
                    for (let key2 in temp[key]) {
                        if (!(key2 in temp[ckey])) temp[ckey][key2] = {}
                        temp[ckey][key2][k] = temp[key][key2];
                    }
                } else {
                    if (!("1" in temp[ckey])) temp[ckey]["1"] = {}
                    temp[ckey]["1"][k] = temp[key];
                }
                delete temp[key];
            } else if (ckey != key) {
                temp[ckey] = temp[key];
                delete temp[key];
            }
        }
        arr.push(temp);
    })

    arr.map(item => {
        let temp = {};
        for (let key in item) {
            let m;
            if (/^(ordinance|bill|billsCommittee)$/.test(key)) {
                temp[key] = {};
                let gazette;
                for (let k in item[key]) {
                    if (m = k.match(/gazette(.+)/)) {
                        if (!gazette) gazette = {};
                        if (typeof item[key][k] === "object" && Object.keys(item[key][k]).filter(v => /^\d+$/.test(v)).length > 0) {
                            for (let i in item[key][k]) {
                                if (!(i in gazette)) gazette[i] = {};
                                gazette[i][m[1].toCamelCase()] = item[key][k][i];
                            }
                        } else {
                            if (!("1" in gazette)) gazette["1"] = {};
                            gazette["1"][m[1].toCamelCase()] = item[key][k];
                        }
                        delete item[key][k];
                    }
                }
                for (let k in item[key]) {
                    temp[key][k] = handle(item[key][k]);
                }
                if (gazette) temp[key].gazette = handle(gazette);
            } else {
                temp[key] = handle(item[key]);
            }
        }
        result.push(temp);
    })
    return result;
}

module.exports = search;