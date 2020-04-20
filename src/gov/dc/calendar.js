// https://www.districtcouncils.gov.hk/datagovhk/dataspec/en/dataspec_Meeting_Calendar_of_DC_en.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "https://www.districtcouncils.gov.hk/datagovhk/psi/Meeting_Calendar_of_DC/Meeting_Calendar_of_DC_{year}_{lang}.csv";

const VALID = {
    lang: /^(en|tc|sc)$/,
    year: /^\d{4}-\d{2}$/,
};
const PARAMS = {
    lang: "en",
    year: "2016-19"
}

function parseSearchFields(params) {
    if ("year" in params) {
        let year = parseInt(params.year),
            now = new Date().getFullYear(),
            max = now - now % 4 + 3;
        year = year - year % 4;
        if (year < 2016) year = 2016;
        if (year > max) year = now - now % 4;
        
        params.year = `${year}-${(year + 3).toString().slice(-2)}`;
    }
    return params;
}

function validateParameters(params) {
    params = parseSearchFields(params);
    let result = cmn.ValidateParameters(params, VALID);
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
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, processed.data))
                .then((res) => {
                    resolve(processData(res))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let body = data.body,
        result = [],
        header = ["district", "date", "time", "meeting", "remarks"];
    body.map(row => {
        let item = {},
            temp = {};
        row.map((v ,i) => item[header[i]] = v);
        for (let key in item) {
            if (key == "district") {
                temp[key] = item[key].replace(" and ", " & ");
            } else if (key == "date") {
                temp[key] = item[key].split(" ")[0];
            } else {
                temp[key] = item[key];
            }
        }
        temp.date = moment(`${temp.date} ${temp.time}`, ["YYYY-MM-DD ah:m","YYYY-MM-DD h:m a"]).format("YYYY-MM-DD HH:mm");
        delete temp.time;
        result.push(temp);
    })
    return result;
}

module.exports = search;