// https://www.aqhi.gov.hk/psi/dd/hk_aqhien_en.pdf
const cmn = require("../../common");
const moment = require("../../moment");
const BASE_URL = "https://www.aqhi.gov.hk/epd/ddata/html/history/{year}/{year}{month}_{lang}.csv";
const EPDStation = require("../../_class").EPDStation;

const VALID = {
    lang: /^(Eng|ChT|ChS)$/,
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
    year: "2013",
    month: "12"
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                en: "Eng",
                tc: "ChT",
                sc: "ChS"
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

    let y = parseInt(params.year) || 2013,
        m = parseInt(params.month) || 12,
        d = parseInt(params.day) || 30,
        h = parseInt(params.hour) || 1,
        dateArr = [y, m - 1, d, h],
        date = moment(dateArr);

    // Data update every 6 months
    // Last update: 2021-03-31
    let today = moment(),
        last = moment([2021, 3, 1]),
        diff = today.diff(last, "M");
    if (!date.isBetween(moment([2013, 11, 30, 1]), today.subtract(diff % 6, "M").startOf("M"), "h", "[]")) {
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
                    from_line: 8
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
        if (!hour || isNaN(parseInt(hour))) return false;
        if (curr !== "") date = moment(curr, "YYYY-MM-DD").format("YYYY-MM-DD");

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