// https://www.legco.gov.hk/datagovhk/data-dictionary-webcast-db-en.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "https://app.legco.gov.hk/wcod/odata/V{type}";

const VALID = {
    type: /^(LiveMeeting|ArchiveMeeting|MeetingInfo)$/
};
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
    type: "LiveMeeting",
    $format: "json",
    $top: 20,
}
const FIELDS = {
    text: {
        "MeetingID": "id",
        "MeetDate": "date",
        "MeetTime": "time",
        "link": "website",
        "AgendaTime": "actualTime",
        "AgendaRunningTime": "elapsedTime",
    }
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["LiveMeeting", "ArchiveMeeting", "MeetingInfo"]
        }
    },
    rename: {
        limit: "$top",
        offset: "$skip",
        sortby: "$orderby"
    }
}
const KEY_TO_NAME = {
    id: "MeetingID",
    name: "MeetName",
    date: "MeetDate",
    time: "MeetTime",
    room: "MeetRoomName"
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        substr = (name, val, chi) => {
            return `substringof('${val}',${chi ? "Chi" :""}${KEY_TO_NAME[name]})`
        };

    if (params.$orderby && !/(asc|desc)/.test(params.$orderby)) {
        let sortorder = params.sortorder || "asc";
        let name = KEY_TO_NAME[params.$orderby] || params.$orderby;
        if (params.$orderby == "date") {
            params.$orderby = `${name} ${sortorder}, ${KEY_TO_NAME.time} ${sortorder}`;
        } else {
            params.$orderby = `${name} ${sortorder}`;
        }
    }
    if (!params.$filter && params.filter) {
        let filter = [];
        for (let key in params.filter) {
            if (key == "id") {
                filter.push(substr(key, params.filter[key]));
            } else if (/^(name|room)^/.test(key)) {
                filter.push(`(${substr(key, params.filter[key])} or ${substr(key, params.filter[key], true)})`);
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
    let result = [];
    data.value.map(item => {
        let temp = {};
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            let m,
                val = item[key];
            if (typeof val === "string") val = val.trimChar("\r\n");
            if (!val) continue;
            if (m = key.match(/^(Chi)?(.*)Name$/)) {
                let lang = m[1] ? "tc" : "en",
                    k = m[2].toCamelCase();
                if (!(k in temp)) temp[k] = {};
                temp[k][lang] = val;
            } else if (key == "actualTime") {
                temp[key] = moment(item[key]).format("YYYY-MM-DD HH:mm:ss");
            } else if (key == "elapsedTime") {
                temp[key] = moment.duration(moment(item[key], "HH:mm:ss").diff(moment("00:00:00", "HH:mm:ss"))).asSeconds();
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