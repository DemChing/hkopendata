const cmn = require("../common");
const moment = require("../moment");

const VALID = {
    pagesize: /^\d+$/,
    offset: /^\d+$/,
    fields: /^[A-z0-9_,]+$/,
    column: /^[A-z0-9_]+$/,
    filter: /^.+$/,
    choose: /^[A-z0-9_]+$/,
    from: /^[0-9-]+$/,
    to: /^[0-9-]+$/,
    sortby: /^[A-z0-9_]+$/,
    sortorder: /^(asc|desc)$/,
}

function validateParameters(params, callback, eReg) {
    let result = cmn.ValidateParameters(params, {}, VALID);

    if (eReg) {
        if ("fields" in params) {
            let fields = params.fields.split(",").filter(v => /^(name_en|name_tc|current_registration|business_address|conditions|registration_history|public_disciplinary_action)$/.test(v));
            if (fields.length > 0) {
                params.fields = fields.join(",");
            } else {
                delete params.fields;
            }
        }
        ["column", "filter", "choose", "from", "to", "sortby", "sortorder"].map(v => delete params[v]);
    }

    if ("pagesize" in params && (params.pagesize > 100 || params.pagesize < 1)) {
        result.error = true;
        result.message = "pagesize should be between 1 and 100";
    }
    if ("offset" in params && params.offset < 1) {
        result.error = true;
        result.message = "offset should be larger than 0";
    }
    if ("column" in params || "filter" in params) {
        if (!("column" in params) || !("filter" in params)) {
            result.error = true;
            result.message = "column and filter should be specified together";
        }
    }
    if ("choose" in params || "from" in params || "to" in params) {
        if (!("choose" in params) || !("from" in params) || !("to" in params)) {
            result.error = true;
            result.message = "choose, from and to should be specified together";
        }
    }
    if ("sortby" in params || "sortorder" in params) {
        if (!("sortby" in params) || !("sortorder" in params)) {
            result.error = true;
            result.message = "sortby and sortorder should be specified together";
        }
    }

    if (!result.error) {
        if (callback) {
            return callback(params);
        }
        result.data = {
            ...params
        }
    }

    return result;
}

function APIRequest(url, params) {
    return new Promise((resolve, reject) => {
        cmn.APIRequest(url, params)
            .then(res => {
                if (res.header.success) {
                    if (res.header.err_code == "0000") resolve(res.result.records)
                    else resolve([]);
                } else {
                    reject(`[${res.header.err_code}] ${res.header.err_msg}`)
                }
            })
            .catch(err => {
                if ("header" in err) {
                    reject(`[${err.header.err_code}] ${err.header.err_msg}`)
                } else {
                    reject(err);
                }
            })
    })
}

function RenameAll(data, rename) {
    const regexName = {
        "tel$1": /^hotline_(\d)$/,
        "remarks$1": /^remark_(\d)$/,
        "$1_website": /^([A-z_]+)_url$/,
        "$1_remarks": /^([A-z_]+)_remark$/,
        "": /^bank_info_/,
    }
    if (Array.isArray(data)) {
        return data.map(v => RenameAll(v, rename))
    } else if (typeof data === "object" && data !== null) {
        let temp = {};
        rename = rename || {};
        for (let key in data) {
            if (data[key] !== null) {
                let ckey = key in rename ? rename[key] : key,
                    t = RenameAll(data[key], rename);
                for (let k in regexName) {
                    ckey = ckey.replace(regexName[k], k)
                }
                ckey = ckey.toCamelCase();
                if (JSON.stringify(t) != "[{}]") temp[ckey] = t;
            }
        }
        return temp;
    }
    return data;
}

function FormatDate(date) {
    let m = moment(date, "LL");
    if (!m.isValid()) m = moment(date, "DD MMM YYYY", "en-US")
    return m.format("YYYY-MM-DD")
}

module.exports = {
    validateParameters,
    APIRequest,
    FormatDate,
    RenameAll
}