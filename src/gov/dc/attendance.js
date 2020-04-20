// https://www.districtcouncils.gov.hk/datagovhk/dataspec/en/dataspec_Attendance_Record_en.pdf

const moment = require("../../moment");
const cmn = require("../../common");
const BASE_URL = "https://www.districtcouncils.gov.hk/datagovhk/psi/Attendance_record_of_DC_members/Attendance_record_of_DC_members_{year}_{lang}.csv";

const VALID = {
    lang: /^(en|tc|sc)$/,
    year: /^\d{4}$/,
};
const PARAMS = {
    lang: "en",
    year: "2019"
}

function parseSearchFields(params) {
    if ("year" in params) {
        let year = parseInt(params.year),
            now = moment().year();
        if (year < 2019) year = 2019;
        if (year > now) year = now;

        params.year = year;
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
    console.writeLog(data.body.filter(v => v[2] != "Elected member").join("\n"))
    let body = data.body,
        result = [],
        header = ["district", "period", "meeting", "type", "name", "rate", "remarks"];
    body.map(row => {
        let item = {},
            temp = {};
        row.map((v, i) => item[header[i]] = v);
        for (let key in item) {
            if (key == "district") {
                temp[key] = item[key].replace(" and ", " & ");
            } else if (key == "period") {
                let split = item[key].split("-"),
                    start = split[0],
                    end = split[1];
                temp.startDate = moment(start, "D.M.YYYY").format("YYYY-MM-DD");
                temp.endDate = moment(end, "D.M.YYYY").format("YYYY-MM-DD");
            } else if (key == "rate") {
                try {
                    let m = item[key].match(/^(\d+)\/(\d+) \((\d+)%\)$/),
                        attended = parseInt(m[0]),
                        total = parseInt(m[1]),
                        rate = 0;
                    if (total > 0) rate = attended / total * 100;
                    temp.attendance = {
                        attended: attended,
                        total: total,
                        rate: `${rate}%`,
                    };
                } catch (e) {
                    temp.attendance = item[key];
                }
            } else {
                let val = item[key].trim(),
                    m = val.match(/(\d{4}.\d{1,2}.\d{1,2}.|\d{1,2}.\d{1,2}.\d{2,4})/g);

                if (m) {
                    m.map(v => {
                        let date = moment(v, ["D.M.YYYY", "YYYY.M.D", ]);
                        if (date.isValid()) {
                            val = val.replace(v, date.format("YYYY-MM-DD"));
                        }
                    })
                }
                temp[key] = val;
            }
        }
        result.push(temp);
    })
    return result.filter(v => typeof v.attendance === "object" && v.attendance.total > 0);
}

module.exports = search;