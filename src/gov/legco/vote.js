// https://www.legco.gov.hk/datagovhk/data-dictionary-votingresult-db-en.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "https://app.legco.gov.hk/vrdb/odata/vVotingResult";

const VALID = {};
const VALID_OPT = {
    $format: /^(json|xml)$/,
    $top: /^[0-9]+$/,
    $skip: /^[0-9]+$/,
    $orderby: /^.+$/,
    $filter: /^.+$/,
    $inlinecount: /^(allpages)$/,
    sortorder: /^(asc|desc)$/,
    detail: /^(true|false)$/
};
const PARAMS = {
    $format: "json",
    $top: 20,
    detail: false,
}
const FIELDS = {
    text: {
        "term_no": "term",
        "vote_number": "voteNumber",
        "vote_time": "time",
        "vote_separate_mechanism": "separateMechanism",
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
    motion: "motion",
    mover: "mover",
    member: "name",
    date: "vote_date",
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        substr = (name, val, lang) => {
            return `substringof('${val}',${(KEY_TO_NAME[name] || name)}${lang == "tc" ? "_ch" : lang == "en" ? "_en" : ""})`
        };

    if (params.$orderby && !/(asc|desc)/.test(params.$orderby)) {
        let sortorder = params.sortorder || "asc";
        let name = KEY_TO_NAME[params.$orderby] || params.$orderby;
        params.$orderby = `${name} ${sortorder}`;
    }
    if (!params.$filter && params.filter) {
        let filter = [];
        for (let key in params.filter) {
            if (/^(motion|mover|member)$/.test(key)) {
                filter.push(`(${substr(key, params.filter[key], "tc")} or ${substr(key, params.filter[key], "en")})`);
            } else if (/^(from|to)^/.test(key)) {
                filter.push(`${KEY_TO_NAME.date} ${key == "from" ? "ge" : "le"} datetime'${params.filter[key]}'`);
            } else if (key == "date") {
                filter.push(`${KEY_TO_NAME.date} eq datetime'${params.filter[key]}'`);
            } else if (key == "type") {
                filter.push(`type eq '${params.filter[key]}'`);
            } else if (key == "vote") {
                filter.push(`vote_number eq ${params.filter[key]}`);
            }
        }
        if (filter.length > 0) params.$filter = filter.join(" and ");
    }
    if (!params.detail) {
        params.$filter = (params.$filter ? `(${params.$filter}) and ` : "") + "display_order eq 1"
    }
    result.detail = !!params.detail;
    ["filter", "sortorder", "detail"].map(v => delete params[v]);

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
                    resolve(processData(res, processed.detail));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, detail) {
    let result = [],
        motions = {},
        voteType = (key) => {
            if (key == "vote") return "voted";
            else if (key == "yes") return "inFavor";
            else if (key == "no") return "against";
            return key;
        };
    data.value.map(item => {
        item = cmn.RenameFields(item, FIELDS);
        let time = moment(item.time).format("YYYY-MM-DD"),
            num = item.voteNumber,
            type = item.type,
            uid = `${type}-${time}-${num}`,
            isSeparate = item.separateMechanism == "Yes";

        if (!(uid in motions)) {
            let temp = {},
                voteData = {};
            for (let key in item) {
                let val = item[key];
                if (!val) continue;
                if (m = key.match(/^(gc|fc|overall)_([a-z]+)(_count)?$/)) {
                    if (m[1] == "overall" && isSeparate) continue;
                    if (m[1] != "overall" && !isSeparate) continue;
                    if (!(m[1] in voteData)) voteData[m[1]] = {
                        absent: {
                            count: 0,
                            member: [],
                        }
                    };
                    if (m[3]) {
                        voteData[m[1]][voteType(m[2])] = {
                            count: val,
                            member: [],
                        }
                    } else {
                        voteData[m[1]].isPass = val == "Passed";
                    }
                } else if (m = key.match(/(.+)_(ch|en)/)) {
                    if (m[1] != "name") {
                        if (!(m[1] in temp)) temp[m[1]] = {};
                        temp[m[1]][m[2] == "ch" ? "tc" : "en"] = val;
                    }
                } else if (key == "time") {
                    temp[key] = time;
                } else if (key == "separateMechanism") {
                    temp.isSeparate = isSeparate;
                } else if (/type$/.test(key)) {
                    temp[key.toCamelCase()] = item[key].toCamelCase();
                } else if (!/start_date|vote_date|constituency|display_order|^vote$/.test(key)) {
                    temp[key.toCamelCase()] = item[key];
                }
            }
            temp.voteData = voteData;
            motions[uid] = temp;
        }

        if (detail) {
            let member = {
                    en: item.name_en,
                    tc: item.name_ch,
                },
                group = motions[uid].isSeparate ? item.constituency == "Geographical" ? "gc" : "fc" : "overall",
                vote = voteType(item.vote.toLowerCase());

            if (!("member" in motions[uid].voteData)) motions[uid].voteData.member = {};
            if (!(group in motions[uid].voteData.member)) motions[uid].voteData.member[group] = [];
            motions[uid].voteData.member[group].push(member);
            if (vote == "absent") motions[uid].voteData[group][vote].count++;
            else motions[uid].voteData[group].present.member.push(member);
            if (vote != "present") {
                motions[uid].voteData[group][vote].member.push(member);
                if (vote != "absent") motions[uid].voteData[group].voted.member.push(member);
            }
        }
    })

    for (let key in motions) {
        if (!detail) {
            for (let group in motions[key].voteData) {
                for (let vote in motions[key].voteData[group]) {
                    motions[key].voteData[group][vote] = motions[key].voteData[group][vote].count;
                }
            }
        }
        result.push(motions[key]);
    }
    return result;
}

module.exports = search;