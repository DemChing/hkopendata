// https://www.legco.gov.hk/datagovhk/data-dictionary-reference-data-tc.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "https://app.legco.gov.hk/ScheduleDB/odata/Tmembership";

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
        "home_url": "website",
    },
    text: {
        "membership_id": "id",
        "term_id": "term",
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
    id: "membership_id",
    member: "member_id",
    committee: "committee_id",
    term: "term_id"
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (params.$orderby && !/(asc|desc)/.test(params.$orderby)) {
        let sortorder = params.sortorder || "asc";
        let name = KEY_TO_NAME[params.$orderby] || params.$orderby;
        params.$orderby = `${name} ${sortorder}`;
    }
    if (!params.$filter && params.filter) {
        let filter = [];
        for (let key in params.filter) {
            if (/^(id|member|committee)$/.test(key)) {
                filter.push(`${KEY_TO_NAME[key]} eq ${params.filter[key]}`);
            } else if (key == "term") {
                filter.push(`${KEY_TO_NAME[key]} eq ${params.filter[key] - 1}`);
            }
        }
        if (filter.length > 0) params.$filter = filter.join(" and ");
    }

    if (!params.$expand && params.expand) {
        let expand = [];

        if (params.expand.term) {
            expand.push("Tterm");
        }
        if (params.expand.committee) {
            expand.push("Tcommittee");
        }
        if (params.expand.member) {
            expand.push("Tmember");
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
        let temp = {},
            term;
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
            } else if (m = key.match(/T(committee|member)/)) {
                let key2 = m[1];
                if (!(key2 in temp)) temp[key2] = {};
                for (let k in item[key]) {
                    if (!item[key][k]) continue;
                    ckey = k.toCamelCase();
                    if (m = k.match(/(.+)_(chi|eng)/)) {
                        ckey = (m[1] == "home_url" ? "website" : m[1]).toCamelCase();
                        if (!(ckey in temp[key2])) temp[key2][ckey] = {};
                        temp[key2][ckey][m[2] == "chi" ? "tc" : "en"] = item[key][k];
                    } else if (!/member_id|committee_id|seq_num|term_id/.test(k)) {
                        temp[key2][ckey] = item[key][k];
                    }
                }
            } else if (key == "Tterm") {
                for (let k in item[key]) {
                    if (!item[key][k]) continue;
                    if (/date/.test(k)) {
                        if (!term) term = {};
                        term[`term_${k}`.toCamelCase()] = moment(item[key][k]).format("YYYY-MM-DD");
                    }
                }
            } else if (/date/.test(key)) {
                temp[ckey] = moment(val).format("YYYY-MM-DD");
            } else if (key == "term") {
                temp[ckey] = parseInt(val) + 1;
            } else {
                temp[ckey] = val;
            }

        }
        if (term) {
            temp = {
                ...temp,
                ...term,
            }
        }
        result.push(temp);
    })
    return result;
}

module.exports = search;