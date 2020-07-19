// https://www.legco.gov.hk/datagovhk/data-dictionary-meeting-schedule-en.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "https://app.legco.gov.hk/ScheduleDB/odata/Tmeeting";

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
        "venue_name": "meetRoom",
        "subject": "meet",
        "meeting_type": "type",
        "agenda_url": "website",
        "home_url": "website",
    },
    text: {
        "meet_id": "id",
        "start_date_time": "time",
        "term_id": "term",
        "slot_id": "slot",
        "venue_code": "roomCode",
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
    id: "meet_id",
    slot: "slot_id",
    name: "subject",
    date: "start_date_time",
    room: "venue_name",
    type: "meeting_type",
    term: "term_id",
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
            if (/^(id|slot)$/.test(key)) {
                filter.push(`${KEY_TO_NAME[key]} eq ${params.filter[key]}`);
            } else if (/^(room|name|type)$/.test(key)) {
                filter.push(`(${substr(key, params.filter[key], "tc")} or ${substr(key, params.filter[key], "en")})`);
            } else if (/^(from|to)^/.test(key)) {
                filter.push(`${KEY_TO_NAME.date} ${key == "from" ? "ge" : "le"} datetime'${params.filter[key]}'`);
            } else if (key == "term") {
                filter.push(`${KEY_TO_NAME[key]} eq ${params.filter[key] - 1}`);
            }
        }
        if (filter.length > 0) params.$filter = filter.join(" and ");
    }

    if (!params.$expand && params.expand) {
        let expand = [];

        if (params.expand.committee) {
            expand.push("Tmeeting_committee/Tcommittee");
        }
        if (expand.length > 0) params.$expand = expand.join()
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
                    resolve(processData(res.value || []));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let result = [];
    data.map(item => {
        let temp = {};
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            let m,
                ckey = key.toCamelCase(),
                val = item[key];
            if (typeof val === "string") val = val.trimChar("\r\n");
            if (!val) continue;
            if (m = ckey.match(/^([A-z]+)(Chi|Eng)$/)) {
                let lang = m[2] == "Chi" ? "tc" : "en",
                    k = m[1].toCamelCase();
                if (!(k in temp)) temp[k] = {};
                temp[k][lang] = val;
            } else if (key == "term") {
                temp[key] = parseInt(item[key]) + 1;
            } else if (key == "time") {
                temp[key] = moment(item[key]).format("YYYY-MM-DD HH:mm:ss");
            } else if (key == "elapsedTime") {
                temp[key] = moment.duration(moment(item[key], "HH:mm:ss").diff(moment("00:00:00", "HH:mm:ss"))).asSeconds();
            } else if (key == "Tmeeting_committee") {
                let temp2 = item[key].map(v => {
                    let t = {};
                    for (let key2 in v) {
                        if (key2 == "Tcommittee") {
                            for (let k in v[key2]) {
                                if (!/committee_id|term_id/.test(k)) t[k] = v[key2][k];
                            }
                        } else if (key2 != "slot_id") {
                            t[key2] = v[key2];
                        }
                    }
                    return t;
                })
                if (temp2.length > 0) temp.committee = processData(temp2);
            } else {
                temp[key.toCamelCase()] = val;
            }
        }
        if (temp.date && temp.time) {
            temp.time = `${moment(temp.date).format("YYYY-MM-DD")} ${moment(temp.time).format("HH:mm")}`
            delete temp.date;
        }
        result.push(temp);
    })
    return result;
}

module.exports = search;