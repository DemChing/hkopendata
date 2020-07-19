// https://www.td.gov.hk/filemanager/en/content_1408/opendata/franchised_and_licensed_ferry_time_and_fare_tables_dataspec_eng.pdf
const cmn = require("../../common");
const moment = require("../../moment");
const UnitValue = require("../../_class").UnitValue;
const BASE_URL = "https://www.td.gov.hk/filemanager/{lang}/content_1408/opendata/ferry_{route}_{type}table_{langFile}.csv";
const FERRY = cmn.GetDataJson("hk-ferry");

const ROUTES = ["central_skw", "central_ysw", "central_pc", "central_mw", "pc_mw_cmw_cc", "central_cc", "central_db", "mawan_c", "mawan_tw", "np_hh", "np_klnc", "np_ktak", "swh_kt", "swh_skt"]

if ("route" in FERRY) {
    FERRY.route.filter(v => ROUTES.indexOf(v.code) == -1).map(v => ROUTES.push(v.code));
}

const VALID = {
    type: /^(route|route-stop|time|fare)$/,
    lang: /^(en|tc|sc)$/,
}
const VALID_OPT = {
    stop: /^[A-z0-9]{6}$/,
    route: new RegExp(`^(${ROUTES.join("|")})$`),
}
const PARAMS = {
    type: "route",
    lang: "en",
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "route-stop", "time", "fare"]
        },
        lang: {
            accepted: {
                tc: "tc",
                sc: "sc",
                en: "en"
            }
        },
        route: {
            accepted: ROUTES
        }
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (Object.keys(FERRY).length == 0) {
        result.error = true;
        result.message = "Please download and place `hk-ferry.json` to `/data` correctly."
    }
    if (params.type != "route" && !("route" in params)) {
        result.error = true;
        result.message = "Missing route";
    }
    if (!result.error) {
        result.data = {
            ...{
                langFile: params.lang == "en" ? "eng" : "chi"
            },
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
            params = processed.data;
            let promise;
            if (/route/.test(params.type)) {
                promise = getRouteData(params);
            } else {
                promise = cmn.CSVFetch(cmn.ReplaceURL(BASE_URL, params));
            }
            promise
                .then((res) => {
                    resolve(processData(res, params))
                })
                .catch((err) => reject(err))
        }
    })
}

function convert(type, code) {
    if (type in FERRY) {
        let temp = FERRY[type].filter(v => v.code == code);
        if (temp.length > 0) {
            let res = {
                ...temp[0]
            }
            delete res.code;
            return res;
        }
    }
    return code;
}

function getRouteData(params) {
    return new Promise((resolve, reject) => {
        let temp = [],
            error;
        if (!params.route) {
            temp = FERRY.route;
        } else {
            let c = convert("route", params.route);
            if (typeof c === "string") error = "Invalid route";
            else temp.push(c);
        }

        if (error) reject(error);
        else {
            resolve(temp.map(v => processRouteData(v)));
        }
    })
}

function processTimeString(str, freq) {
    let arr = str.split("-");
    if (arr.length == 1) {
        return new UnitValue({
            type: "time",
            category: "min",
            value: parseFloat(arr[0]),
        });
    }
    return {
        min: new UnitValue({
            type: "time",
            category: "min",
            value: parseFloat(arr[freq ? 1 : 0]),
        }),
        max: new UnitValue({
            type: "time",
            category: "min",
            value: parseFloat(arr[freq ? 0 : 1]),
        })
    }
}

function processRouteData(data) {
    let res = {};
    for (let key in data) {
        if (/^(origin|destination)$/.test(key)) {
            res[key] = convert("pier", data[key]);
            delete res[key].loc;
        } else if (key == "company") {
            res[key] = convert(key, data[key]);
            res.companyCode = data[key];
        } else if (key == "stops") {
            res[key] = data[key].map(v => convert("pier", v).loc)
        } else if (key == "duration") {
            res[key] = [];
            for (let sec in data[key]) {
                let piers = sec.split("-").map(v => convert("pier", v)),
                    temp = {
                        origin: piers[0],
                        destination: piers[1],
                    };
                delete temp.origin.loc;
                delete temp.destination.loc;
                if (typeof data[key][sec] === "string") {
                    temp.ordinaryFerry = processTimeString(data[key][sec]);
                } else if (typeof data[key][sec] === "object") {
                    for (let k in data[key][sec]) {
                        temp[k + (k == "roundTrip" ? "" : "Ferry")] = processTimeString(data[key][sec][k]);
                    }
                }
                res[key].push(temp)
            }
        } else if (!/^(code)$/.test(key)) {
            res[key] = data[key];
        }
    }
    return res;
}

function processData(data, params) {
    let result = [];
    if (params.type == "route") {
        result = data.map(v => {
            delete v.stops;
            delete v.remarks;
            return v;
        })
    } else if (params.type == "route-stop") {
        result = data[0].stops;
    } else if (params.type == "time") {
        let temp = {},
            temp2 = {},
            route = convert("route", params.route),
            stops = route.stops.map(code => {
                let pier = convert("pier", code);
                delete pier.loc;
                let str = Object.keys(pier).map(k => pier[k]).join("|");
                pier.regexp = new RegExp(`(${str})`, "i");
                return pier;
            }),
            remarks = [];
        data.body.map(row => {
            let dir = row[0].replace("Chueung Chau", "Cheung Chau");
            if (!(dir in temp)) temp[dir] = {};
            if (!(row[1] in temp[dir])) temp[dir][row[1]] = [];
            temp[dir][row[1]].push(moment(row[2].replace(/\./g, ""), ["HH:mm A", "Hmm A"]).format("HH:mm") + (row[3].trim() == "" ? "" : `[${row[3]}]`))
            remarks.push(row[3]);
        })
        remarks = remarks.filter((v, i, l) => v != "" && l.indexOf(v) == i).sort()
            .map(v => {
                let t = {};
                for (let lang in route.remarks.time[v]) {
                    t[lang] = `[${v}] ${route.remarks.time[v][lang]}`;
                }
                return t;
            });
        for (let dir in temp) {
            let arr = stops.filter(v => dir.search(v.regexp) != -1)
                .sort((a, b) => dir.search(a.regexp) - dir.search(b.regexp)),
                origin = {
                    ...arr[0]
                },
                destination = {
                    ...arr[1]
                },
                timetable = {
                    mon: [],
                    tue: [],
                    wed: [],
                    thu: [],
                    fri: [],
                    sat: [],
                    sun: [],
                    ph: [],
                };
            delete origin.regexp;
            delete destination.regexp;
            for (let days in temp[dir]) {
                let available = strToWeekday(days);
                for (let d in available) {
                    if (available[d]) timetable[d] = timetable[d].concat(temp[dir][days]);
                }
            }

            for (let d in timetable) {
                timetable[d] = timetable[d].sort();
            }

            let tkey = `${origin.en}-${destination.en}`;
            if (!(tkey in temp2)) {
                temp2[tkey] = {
                    origin,
                    destination,
                    timetable,
                    remarks
                }
            } else {
                for (let d in timetable) {
                    temp2[tkey].timetable[d] = temp2[tkey].timetable[d].concat(timetable[d]).sort();
                }
            }
        }
        for (let tkey in temp2) {
            result.push(temp2[tkey]);
        }
    } else if (params.type == "fare") {
        let temp = {},
            temp2 = {},
            route = convert("route", params.route);
        data.body
            .filter(v => v.join("").trim().length > 10)
            .map(row => {
                let routePart, ferryType, payment, point;
                if (params.route == "central_pc") {
                    routePart = row.shift();
                    ferryType = row.splice(2, 1)[0].trim();
                } else if (/^(central_mw|central_cc)$/.test(params.route)) {
                    ferryType = row.splice(2, 1)[0].trim();
                } else if (params.route == "pc_mw_cmw_cc") {
                    routePart = row.shift();
                    row.splice(1, 0, "")
                } else if (params.route == "central_db") {
                    payment = row.splice(2, 1)[0];
                    point = row.splice(3, 1)[0];
                }
                let type = row[0].split("-").map(v => v.trim()),
                    ticket = type.shift(),
                    passenger = type.join("-"),
                    amount = {
                        fare: parseFloat(point) || parseFloat(row[2].replace("$", "")) || 0
                    },
                    passCheck = (str) => {
                        if (/65|elderly|長者|长者/i.test(str)) {
                            str = "elderly";
                        } else if (/child|小童/i.test(str)) {
                            str = /12/i.test(str) ? "child" : "baby";
                        } else if (/adult|成人/i.test(str)) {
                            str = "adult";
                        } else if (/student|學生|学生/i.test(str)) {
                            str = "student";
                        } else if (/disabilities|disabled|殘疾|残疾/i.test(str)) {
                            str = "disability";
                        }
                        return str;
                    };
                if (/^(mawan_c|mawan_tw)$/.test(params.route)) {
                    payment = row[3] == "1" ? "八達通" : "非登記八達通";
                    row[3] = "";
                }
                if (ferryType && ferryType != "-") amount.ferryType = ferryType;
                if (!routePart) {
                    let o = convert("pier", route.origin),
                        d = convert("pier", route.destination)
                    routePart = `${o[params.lang]}${params.lang == "en" ? " - " : "—"}${d[params.lang]}`;
                }
                amount.routePart = routePart;
                if (/bicycle|單車|单车/i.test(ticket)) {
                    ticket = "bicycle";
                } else if (/freight|貨物|货物/i.test(ticket)) {
                    ticket = "freight";
                } else if (/foreign domestic helper|外籍家庭傭工|外籍家庭佣工/i.test(ticket)) {
                    ticket = "specialFare";
                    passenger = "domesticHelper"
                } else if (!passenger) {
                    ticket = passCheck(ticket)
                }

                if (passenger) {
                    amount.passenger = passCheck(passenger);
                }
                if (payment) {
                    if (/cash|現金|现金/i.test(payment)) {
                        payment = "cash";
                    } else if (/octopus|八達通|八达通/i.test(payment)) {
                        payment = /non-registered|非登記|非登记/i.test(payment) ? "octopus" : "regedOctopus";
                    } else if (/transport card|T卡|per single journey|外籍家庭傭工|外籍家庭佣工/i.test(payment)) {
                        payment = "";
                    }
                    amount.payment = payment;
                }
                if (!(ticket in temp)) temp[ticket] = {};
                if (!(row[1] in temp[ticket])) temp[ticket][row[1]] = [];

                if (row[3]) {
                    amount.remarks = row[3].split(",").map(v => {
                        let r = v.trim();
                        if (/^\d+$/.test(r) && r in route.remarks.fare) {
                            let remark = {};
                            for (let lang in route.remarks.fare[r]) {
                                remark[lang] = `[${r}] ${route.remarks.fare[r][lang]}`;
                            }
                            r = {
                                ...remark
                            }
                        }
                        return r;
                    })
                    if (/transport card|T卡/i.test(ticket)) {
                        amount.remarks.push({
                            "en": "Transport Card (A): $1310 : 1550 Point, Transport Card (B): $858 : 930 Point",
                            "tc": "T卡 (A): $1310 : 1550 儲點, T卡 (B): $858 : 930 儲點",
                            "sc": "T卡 (A): $1310 : 1550 储点, T卡 (B): $858 : 930 储点",
                        })
                    }
                }
                temp[ticket][row[1]].push(amount);
            })

        for (let ticket in temp) {
            for (let time in temp[ticket]) {
                temp[ticket][time].map(item => {
                    let fare = item.fare;
                    if ("remarks" in item) {
                        fare = {
                            amount: item.fare,
                            remarks: item.remarks,
                        }
                    }
                    if (!(item.routePart in temp2)) temp2[item.routePart] = {};
                    if (!(ticket in temp2[item.routePart])) temp2[item.routePart][ticket] = {};

                    let t = temp2[item.routePart][ticket],
                        tArr = [];
                    if (item.payment) {
                        if (!(item.payment in t)) t[item.payment] = {};
                        t = t[item.payment];
                        tArr.push(item.payment);
                    }
                    if (item.passenger) {
                        if (!(item.passenger in t)) t[item.passenger] = {};
                        t = t[item.passenger];
                        tArr.push(item.passenger);
                    }
                    if (item.ferryType) {
                        if (!(item.ferryType in t)) t[item.ferryType] = {};
                        t = t[item.ferryType];
                        tArr.push(item.ferryType);
                    }
                    if (time) t[time] = fare;
                    else {
                        if (tArr.length > 0) {
                            t = temp2[item.routePart][ticket];
                            tArr.map((v, i) => {
                                if (i == tArr.length - 1) {
                                    t[v] = fare;
                                } else {
                                    t = t[v];
                                }
                            })
                        } else {
                            temp2[item.routePart][ticket] = fare;
                        }
                    }
                })
            }
        }

        for (let part in temp2) {
            result.push({
                route: part,
                fare: {
                    ...temp2[part]
                }
            })
        }
    }
    return result;
}

function strToWeekday(str) {
    let regexWeek = {
            mon: /mondays?|mon|weekday|一/gi,
            tue: /tuesdays?|tue|weekday|二/gi,
            wed: /wednesdays?|wed|weekday|三/gi,
            thu: /thursdays?|thu|weekday|四/gi,
            fri: /fridays?|fri|weekday|五/gi,
            sat: /saturdays?|sat|weekend|六/gi,
            sun: /sundays?|sun|weekend|日/gi,
            ph: /(public|general) holiday|公(衆|眾|众)假期/gi
        },
        available = {
            mon: false,
            tue: false,
            wed: false,
            thu: false,
            fri: false,
            sat: false,
            sun: false,
            ph: false,
        },
        tempStr = str,
        replaceStr = [],
        except = [],
        m;
    tempStr = tempStr.replace("星期一 至 星期一", "星期一").replace(/星期日 \(公(衆|眾|众)假期除外\)/, "星期日及公眾假期");
    if (/daily|每天|每日/i.test(tempStr)) {
        for (let key in available) {
            available[key] = true;
        }
        return available;
    }
    for (let day in regexWeek) {
        if (m = tempStr.match(regexWeek[day])) {
            tempStr = tempStr.replace(regexWeek[day], `{${replaceStr.length}}`);
            replaceStr.push(day);
        }
    }
    if (m = tempStr.match(/except \{(\d+)\}/i)) {
        except.push(replaceStr[m[1]]);
        tempStr = tempStr.replace(m[0], "")
    } else if (m = tempStr.match(/\{(\d+)\}除外/i)) {
        except.push(replaceStr[m[1]]);
        tempStr = tempStr.replace(m[0], "")
    }

    if (m = tempStr.match(/(\{(\d+)\}(to|至| )+\{(\d+)\})/)) {
        let ok = false,
            st = replaceStr[m[2]],
            ed = replaceStr[m[4]];
        for (let key in available) {
            if (key == st) ok = true;
            if (ok) available[key] = true;
            if (key == ed) ok = false;
        }
        tempStr = tempStr.replace(m[1], "");
    }
    while (m = tempStr.match(/(\{(\d+)\})/)) {
        for (let key in available) {
            if (key == replaceStr[m[2]]) {
                available[key] = true;
                tempStr = tempStr.replace(m[1], "");
            }
        }
    }
    except.map(day => available[day] = false)
    return available;
}

module.exports = search;