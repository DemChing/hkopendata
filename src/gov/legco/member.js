// https://www.legco.gov.hk/datagovhk/data-dictionary-reference-data-tc.pdf

const cmn = require("../../common");
const BASE_URL = "https://app.legco.gov.hk/ScheduleDB/odata/Tmember";

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
        "firstname": "forename",
    },
    text: {
        "member_id": "id",
        "latest_term_id": "latest_term",
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
    id: "member_id",
    forename: "firstname",
    latestTerm: "latest_term_id"
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        substr = (name, val, lang) => {
            return `substringof('${val}',${(KEY_TO_NAME[name] || name)}${lang == "tc" ? "_chi" : lang == "en" ? "_eng" : ""})`
        };;

    if (params.$orderby && !/(asc|desc)/.test(params.$orderby)) {
        let sortorder = params.sortorder || "asc";
        let name = KEY_TO_NAME[params.$orderby] || params.$orderby;
        params.$orderby = `${name} ${sortorder}`;
    }
    if (!params.$filter && params.filter) {
        let filter = [];
        for (let key in params.filter) {
            if (key == "id") {
                filter.push(`${KEY_TO_NAME[key]} eq ${params.filter[key]}`);
            } else if (key == "name") {
                filter.push(`(concat(surname_chi, firstname_chi) eq '${params.filter[key]}' or concat(concat(surname_eng, ' '), firstname_eng) eq '${params.filter[key]}' or concat(concat(firstname_eng, ' '), surname_eng) eq '${params.filter[key]}')`);
            } else if (key == "surname" || key == "forename") {
                filter.push(`(${substr(key, params.filter[key], "tc")} or ${substr(key, params.filter[key], "en")})`);
            } else if (key == "latestTerm") {
                filter.push(`${KEY_TO_NAME[key]} eq ${params.filter[key] - 1}`);
            }
        }
        if (filter.length > 0) params.$filter = filter.join(" and ");
    }

    if (!params.$expand && params.expand) {
        let expand = [];

        if (params.expand.memberTerm) {
            expand.push("Tmember_term");
        }
        if (expand.length > 0) params.$expand = expand.join();
    }
    ["filter", "sortorder", "expand"].map(v => delete params[v]);

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
                    resolve(processData(res, processed));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let result = [];
    data.value.map(item => {
        item = cmn.RenameFields(item, FIELDS);
        let temp = {};
        for (let key in item) {
            let val = item[key],
                ckey = key.toCamelCase(),
                m;
            if (typeof val === "string") val = val.trimChar("\r\n");
            if (!val) continue;
            if (m = key.match(/(.+)_(chi|eng)/)) {
                ckey = m[1].toCamelCase();
                if (!(ckey in temp)) temp[ckey] = {};
                temp[ckey][m[2] == "chi" ? "tc" : "en"] = val;
            } else if (key == "Tmember_term") {
                temp.memberTerm = item[key].map(v => {
                    let t = {};
                    for (let k in v) {
                        ckey = k.toCamelCase();
                        if (k == "term_id") {
                            t.term = parseInt(v[k]) + 1;
                        } else {
                            t[ckey] = v[k];
                        }
                    }
                })
            } else if (key == "latest_term") {
                temp[ckey] = parseInt(val) + 1;
            } else if (!/seq_num/.test(key)) {
                temp[ckey] = val;
            }

        }
        result.push(temp);
    })
    return result;
}

module.exports = search;