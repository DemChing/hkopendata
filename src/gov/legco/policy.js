// https://www.legco.gov.hk/datagovhk/data-dictionary-policy-db-en.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "https://app.legco.gov.hk/PolicyIssuesDB/odata/Vpolicy_issues_events";

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
        "context_name": "origin",
        "event_summary": "description",
        "event_key": "id",
        "event_url": "website",
        "_name|event_": "",
        "context": "origin"
    },
}
const SEARCH_CONFIG = {
    rename: {
        limit: "$top",
        offset: "$skip",
        sortby: "$orderby"
    }
}
const KEY_TO_NAME = {
    id: "event_key",
    area: "area_name",
    issue: "issue_name",
    date: "event_date",
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
                filter.push(`${KEY_TO_NAME[key]} eq ${params.filter[key]}`);
            } else if (/^(area|issue)$/.test(key)) {
                filter.push(`(${substr(key, params.filter[key], "tc")} or ${substr(key, params.filter[key], "en")})`);
            }
        }
        if (params.filter.from && params.filter.to) {
            let from = moment(params.filter.from),
                to = moment(params.filter.to),
                start = from.clone(),
                months = [];
            while (start.isSameOrBefore(to)) {
                months.push(start.format(".MM.YY"));
                start = start.add(1, "month");
            }
            filter.push(`substringof(${KEY_TO_NAME.date},'${months.join()}'`);
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
            } else if (/code/.test(key)) {
                temp[ckey] = val.trimChar(",")
            } else if (key == "date") {
                let split = val.split(/[^0-9./-]/).filter(v => v.length > 0);
                temp[ckey] = split.map(v => moment(v, "MM.YY", "DD.MM.YY").format("YYYY-MM-DD"));
                if (temp[ckey].length == 1) temp[ckey] = temp[ckey][0];
            } else {
                temp[ckey] = val;
            }
        }
        result.push(temp);
    })
    return result;
}

module.exports = search;