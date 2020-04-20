// https://www.1823.gov.hk/f/upload/1229/1823_cal_dictionary.pdf

const moment = require("../../moment");
const fs = require("fs");
const cmn = require("../../common");
const BASE_URL = "https://www.1823.gov.hk/common/ical/{lang}.json";
const HOLIDAY = cmn.GetDataJson("hk-holiday");

const VALID = {
    lang: /^(en|tc|sc)$/,
    year: /^[0-9]{4}$/
};
const PARAMS = {
    lang: "en",
    year: moment().format("YYYY")
}

function validateParameters(params) {
    let result = cmn.ValidateParameters(params, VALID);
    if (parseInt(params.year) < 2018 || parseInt(params.year) > parseInt(moment().format("YYYY"))) {
        result.error = true;
        result.message = "Invalid year. Range: 2018 - Current year."
    }
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
            }),
            params;
        if (processed.error) {
            reject(processed);
        } else {
            let result = [],
                complete = false;
            params = processed.data;
            if (params.year in HOLIDAY) {
                for (let date in HOLIDAY[params.year]) {
                    if (params.lang in HOLIDAY[params.year][date]) {
                        result.push({
                            date: date,
                            name: HOLIDAY[params.year][date][params.lang]
                        });
                        complete = true;
                    }
                }
            }
            if (!complete) {
                if (typeof opts === "undefined") opts = {};
                opts = {
                    ...params,
                    ...opts
                };
                cmn.APIRequest(cmn.ReplaceURL(BASE_URL, params))
                    .then((res) => {
                        resolve(processData(res, opts));
                    })
                    .catch((err) => reject(err))
            } else {
                resolve(result);
            }
        }
    })
}

function processData(data, opts) {
    let result = {},
        updated = false,
        lang = opts.lang;
    data.vcalendar[0].vevent.map((item) => {
        let date = moment(item.dtstart[0], "YYYYMMDD"),
            year = date.format("YYYY");
        if (!(year in result)) result[year] = [];
        result[year].push({
            date: date.format("YYYY-MM-DD"),
            name: item.summary
        });
    })
    Object.keys(result).map((year) => {
        if (!(year in HOLIDAY)) {
            HOLIDAY[year] = {};
            updated = true;
        }
        result[year].map((v) => {
            if (!(v.date in HOLIDAY[year])) {
                HOLIDAY[year][v.date] = {};
                updated = true;
            }
            if (!(lang in HOLIDAY[year][v.date])) {
                HOLIDAY[year][v.date][lang] = v.name;
                updated = true;
            }
        })
    })
    if (updated) {
        fs.writeFile("data/hk-holiday.json", JSON.stringify(HOLIDAY), (err) => {});
    }
    return result;
}

function is(date, office, day) {
    return new Promise((resolve, reject) => {
        let d = moment(date);
        if (d.isValid()) {
            let year = d.format("YYYY");
            date = d.format("YYYY-MM-DD");
            if (typeof day === "undefined") day = 5;
            if (!office && day == 7 && d.isoWeekday() == 7) { // 7: Sunday
                resolve(true);
            } else if (office && Array.isArray(day) && day.indexOf(d.isoWeekday()) != -1) { // day: Array of non-office day
                resolve(true);
            } else if (office && !Array.isArray(day) && d.isoWeekday() > day) { // day: N-days of work (start from Monday)
                resolve(true);
            } else if (!(year in HOLIDAY)) {
                search({
                        year
                    })
                    .then((res) => {
                        resolve(res.filter(v => v.date == date).length > 0)
                    })
                    .catch((err) => reject(err))
            } else {
                resolve(date in HOLIDAY[year])
            }
        } else {
            reject("Invalid date");
        }
    })
}

function isPublic(date) {
    return is(date, false)
}

function isHoliday(date) {
    return is(date, false, 7)
}

function isOffice(date, day) {
    return is(date, true, day)
}

module.exports = {
    search,
    isPublic,
    isHoliday,
    isOffice
}