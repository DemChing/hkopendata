// https://www.aqhi.gov.hk/psi/dd/hk_apien_en.pdf
const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "http://www.aqhi.gov.hk/api_history/download/hourly/{lang}/hr{month}{year}{langabbr}.csv";
const EPDStation = require("../../_class").EPDStation;

const BUFFER_STRING = {
    en: ",,Roadside API,,,General API",
    tc: ",,路邊 ,,,一般"
}
const VALID = {
    lang: /^(eng|tc_chi)$/,
    year: /^[0-9]{4}$/,
    month: /^[0-9]{1,2}$/,
}
const VALID_OPT = {
    station: /^[A-Z]{2,3}$/,
    day: /^[0-9]{1,2}$/,
    hour: /^[0-9]{1,2}$/,
    type: /^(g|r)$/,
}
const PARAMS = {
    lang: "en",
    year: "1999",
    month: "07"
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                en: "eng",
                tc: "tc_chi",
            }
        },
        type: {
            accepted: ["g", "r"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        hasStation = true;

    if ("station" in params) {
        hasStation = !cmn.HasDataJson("aqhi") || cmn.SearchDataJson("aqhi", {
            "code": params.station
        }).length != 0;
        if (!hasStation) {
            result.error = true;
            result.message = "Invalid station code";
        }
    }

    if ("month" in params) params.month = `00${params.month}`.slice(-2);

    let y = parseInt(params.year) || 1999,
        m = parseInt(params.month) || 7,
        d = parseInt(params.day) || 1,
        h = parseInt(params.hour) || 1,
        dateArr = [y, m - 1, d, h],
        date = moment(dateArr);

    if (!date.isBetween(moment([1999, 6, 1, 1]), moment([2014, 0, 1, 0]), "h", "[]")) {
        result.error = true;
        result.message = "Invalid `year`, `month`, `day` or `hour`";
    } else if ("day" in params) {
        let start = dateArr.slice(0),
            end = dateArr.slice(0);

        start[3] = "hour" in params ? start[3] : 1;
        end[3] = "hour" in params ? end[3] : 24;
        result.range = {
            start,
            end
        };
    }

    if (!result.error) {
        result.data = {
            ...params,
            langabbr: params.lang !== "eng" ? "c" : ""
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
            range,
            params;
        if (processed.range) {
            range = JSON.parse(JSON.stringify(processed.range));
            delete processed.range;
        }
        if (processed.error) {
            reject(processed);
        } else {
            params = processed.data;
            opts = {
                ...opts,
                ...params,
                range
            };
            cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, params), {
                    encoding: "big5",
                    preprocess: data => {
                        let idx = data.indexOf(BUFFER_STRING.en);
                        if (idx === -1) idx = data.indexOf(BUFFER_STRING.tc);
                        if (idx !== -1) idx = data.indexOf("\n", idx);
                        return data.slice(idx + 1, data.length);
                    }
                })
                .then((res) => {
                    resolve(processData(res, opts))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let stations = data.header.slice(2, data.header.length)
        .map(name => new EPDStation(name)),
        result = Array(stations.length),
        date = "";
    data.body.map(row => {
        let curr = row.shift().trim(),
            hour = row.shift().trim();
        if (!hour || isNaN(hour = parseInt(hour))) return false;
        if (curr !== "") date = moment(curr, ["DD/MM/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD");

        hour = `00${hour + 1}`.slice(-2);
        let mdate = moment(`${date} ${hour}:00`);
        if (opts.range && !mdate.isBetween(moment(opts.range.start), moment(opts.range.end), "h", "[]")) return false;

        if (opts.hour && parseInt(hour) !== parseInt(opts.hour)) return false;

        row.map((value, i) => {
            if (value === "") return;
            if (opts.station && opts.station !== stations[i].code) return;
            if (opts.type && opts.type !== stations[i].type) return;
            if (!result[i]) result[i] = {
                station: stations[i],
                data: {}
            }
            if (!(date in result[i].data)) result[i].data[date] = {};
            result[i].data[date][hour] = parseInt(value);
        })
    })

    return result.filter(row => row)
        .map(row => {
            let temp = []
            for (let date in row.data) {
                temp.push(...Object.keys(row.data[date])
                    .map(hour => ({
                        station: row.station,
                        date,
                        time: `${hour}:00`,
                        value: row.data[date][hour]
                    })))
            }
            return temp;
        }).flat();
}

module.exports = search;