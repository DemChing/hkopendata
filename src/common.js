require("./lib/prototype");
const DEFAULT_SEARCH_INDEX = {
    airports: "iata",
    airlines: "icao",
    stations: "code",
    default: "name",
}

function _getAxiosInstance() {
    return global.axiosInstance || require("./utils").CreateAxiosInstance();
}

function _cleanInvalidJsonString(text) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
    return text.replace(/(\r|\n)/g, "");
}

function APIRequest(url, params, post) {
    return new Promise((resolve, reject) => {
        let data = {
                params,
            },
            method = "get";
        if (post) {
            data = params;
            method = "post";
        }
        _getAxiosInstance()[method](url, data)
            .then((res) => {
                if (typeof res.data === "string") {
                    try {
                        resolve(JSON.parse(_cleanInvalidJsonString(res.data)))
                    } catch (e) {
                        reject(res.data);
                    }
                } else {
                    resolve(res.data)
                }
            })
            .catch((err) => {
                if (err.response && "data" in err.response) reject(err.response.data);
                else reject(err);
            })
    })
}

function CSVFetch(url, opts) {
    return new Promise((resolve, reject) => {
        _getAxiosInstance()({
                url,
                responseType: 'arraybuffer',
            }).then((res) => {
                return CSVToArray(res.data, opts)
            })
            .then(res => resolve(res))
            .catch((err) => reject(err))
    })
}

function CSVToArray(data, opts) {
    return new Promise((resolve, reject) => {
        const parse = require("csv-parse");
        opts = {
            ...{
                bom: true,
            },
            ...opts
        }

        if ("encoding" in opts) {
            const iconv = require("iconv-lite");
            data = iconv.decode(data, opts.encoding);
            delete opts.encoding;
        }

        if (typeof opts.preprocess === "function") data = opts.preprocess(data);

        let result = {};
        parse(data, opts, (err, res) => {
            if (err) reject(err);
            else {
                if (!opts.noHeader) {
                    result.header = res.shift();
                }
                result.body = res.filter(v => v.join("") != "");
                resolve(result);
            }
        })
    })
}

function XMLFetch(url, params, opts) {
    return new Promise((resolve, reject) => {
        _getAxiosInstance()(url, {
                responseType: 'text',
                params,
            }).then((res) => {
                return XMLToJson(res.data, opts)
            })
            .then(res => resolve(res))
            .catch((err) => reject(err))
    })
}

function XMLToJson(data, opts) {
    opts = opts || {};
    const xmlParser = require("fast-xml-parser");
    return xmlParser.parse(data, opts);
}

function _processMatchText(input) {
    return input.toString().toLowerCase().replace(/\s/g, "")
}

function _identical(src, val) {
    if (src && typeof src === "object") {
        return Object.keys(src).reduce((p, c) => p || _identical(src[c], val), false)
    }
    return src && val && _processMatchText(src) == _processMatchText(val)
}

function _contains(src, val) {
    if (src && typeof src === "object") {
        return Object.keys(src).reduce((p, c) => p || _contains(src[c], val), false)
    }
    return src && val && _processMatchText(src).indexOf(_processMatchText(val)) != -1
}

function _inRange(val, min, max) {
    return parseFloat(val) >= (max > min ? min : max) && parseFloat(val) <= (max > min ? max : min)
}

function _replaceKey(input, params) {
    if (typeof input !== 'string') return input;

    for (let key in params) {
        input = input.replace(new RegExp("{" + key + "}", "g"), params[key]);
    }
    return input;
}

function ReplaceURL(url, params) {
    if (typeof params === "object") {
        for (let key in params) {
            params[key] = _replaceKey(params[key], params);
        }
        url = _replaceKey(url, params);
    }
    return url.replace(/\{[a-z_-]+\}/g, '')
        .replace(/\/+/g, '/')
        .replace(/:\//, '://');
}

function MatchData(src, opts, partial) {
    let valid = true,
        match = _identical;
    if (partial) match = _contains;
    if (typeof opts === "object") {
        for (let item in src) {
            if (item in opts) {
                valid = valid && match(src[item], opts[item])
            } else if (Array.isArray(src[item])) {
                valid = valid && src[item].reduce((p, c) => p || MatchData(c, opts, partial), false)
            }
        }
        return valid;
    }
    return false
}

function GetDataJson(type, isArray) {
    let obj = isArray ? [] : {},
        data = HasDataJson(type);
    if (data !== false) obj = data;
    return obj;
}

function HasDataJson(type) {
    const DATA = require("../data/");
    if (type in DATA.list) type = DATA.list[type];
    let data = DATA.Get(type);
    return (Array.isArray(data) && data.length > 0) || (typeof data === "object" && Object.keys(data).length > 0) ? data : false;
}

function UpdateDataJson(type, data) {
    const DATA = require("../data/");
    DATA.Set(type, data);
}

function SearchDataJson(type, opts) {
    let params = {},
        data = HasDataJson(type) || [];
    if (typeof opts === "undefined") {
        return false;
    } else if (typeof opts === "object") {
        params = opts;
    } else {
        params[type in DEFAULT_SEARCH_INDEX ? DEFAULT_SEARCH_INDEX[type] : DEFAULT_SEARCH_INDEX.default] = opts;
    }
    return data.filter((item) => MatchData(item, params));
}

function ValidateParameters(params, valid, validOpt) {
    let result = {
        error: false,
        message: "",
    };
    for (let key in valid) {
        if (!valid[key].test(params[key])) {
            result.error = true;
            result.message = "Incorrect parameter: " + key
        }
    }

    if (typeof validOpt === "object") {
        for (let key in params) {
            if (key in validOpt && !validOpt[key].test(params[key])) {
                result.error = true;
                result.message = "Incorrect parameter: " + key
            }
        }
    }
    return result;
}

function parseRenameRegexp(key) {
    let arr = key.split("$f-");
    if (arr.length == 1) {
        return new RegExp(arr[0]);
    } else {
        return new RegExp(arr[0], arr[1]);
    }
}

function RenameFields(data, config) {
    if (Array.isArray(data)) return data.map(v => RenameFields(v, config))
    else if (typeof data !== "object" || data === null) return data;

    let result = {},
        keys = [],
        regexs = [];
    for (let type in config) {
        if (type == "regex") {
            Object.keys(config[type]).map(v => regexs.push(parseRenameRegexp(v)))
        } else if (/latitude|longitude|easting|northing/.test(type)) {
            keys = keys.concat(config[type])
        } else {
            keys = keys.concat(Object.keys(config[type]))
        }
    }
    for (let key in data) {
        let hasKey = keys.indexOf(key) != -1,
            hasRegex = regexs.reduce((p, c) => {
                return p || c.test(key)
            }, false);
        if (!hasKey && !hasRegex) {
            result[key] = data[key];
        }
    }
    for (let type in config) {
        for (let key in config[type]) {
            let m;
            if (type == "regex") {
                m = parseRenameRegexp(key);
                Object.keys(data).filter(v => m.test(v) && (data[v] === null || data[v].toString().trimChar(" -") != "")).map((v) => {
                    result[v.replace(m, config[type][key])] = data[v];
                    delete data[v];
                })
            } else if (type == "latitude" || type == "longitude") {
                if (config[type][key] in data) {
                    const CoordinateValue = require("./_class/CoordinateValue");
                    if (!("coordinate" in result)) result.coordinate = {}
                    result.coordinate[type] = new CoordinateValue(data[config[type][key]]).toCoor();
                }
            } else if (type == "easting" || type == "northing") {
                if (config[type][key] in data) {
                    const CoordinateValue = require("./_class/CoordinateValue");
                    if (!("coordinateHK" in result)) result.coordinateHK = {
                        _type: "tmerc",
                        _system: "hk1980",
                    }
                    result.coordinateHK[type] = new CoordinateValue(data[config[type][key]]).toCoor();
                }
            } else if (key in data && (data[key] === null || data[key].toString().trimChar(" -") != "")) {
                if (type == "number") {
                    if (typeof data[key] === "string") {
                        m = data[key].replace(/[^\d.-]/g, "").match(/([0-9.]+)/);
                        result[config[type][key]] = m ? parseFloat(m[1]) : data[key];
                    } else {
                        result[config[type][key]] = data[key];
                    }
                } else if (type == "minmax") {
                    m = data[key].match(/([0-9.]+)/g);
                    result[config[type][key]] = {
                        min: parseFloat(m[0]),
                        max: parseFloat(m[1]),
                    };
                } else if (type == "boolean") {
                    result[config[type][key]] = data[key] === "0" ? false : Boolean(data[key]);
                } else {
                    result[config[type][key]] = data[key];
                }
            }
        }
    }

    return result;
}

function StrToWeekTime(str) {
    let tempStr = str,
        index = 0,
        result = {},
        chiNum = {
            "一": 1,
            "二": 2,
            "三": 3,
            "四": 4,
            "五": 5,
            "六": 6,
            "七": 7,
            "八": 8,
            "九": 9
        },
        regexWeek = {
            mon: /monday|mon|weekday|一/gi,
            tue: /tuesday|tue|weekday|二/gi,
            wed: /wednesday|wed|weekday|三/gi,
            thu: /thursday|thu|weekday|四/gi,
            fri: /friday|fri|weekday|五/gi,
            sat: /saturday|sat|weekend|六/gi,
            sun: /sunday|sun|weekend|日/gi,
            ph: /(public|general) holiday|p\.h\.|公(衆|眾)假期/gi
        },
        weekday, time, m;
    let available = {
            mon: false,
            tue: false,
            wed: false,
            thu: false,
            fri: false,
            sat: false,
            sun: false,
            ph: false,
        },
        unavailable = [];
    let customFix = {
        "midnight": /12(:00)?\s*(midnight|mn)|(午夜|凌晨)12時/,
        "十一時": "＋一時",
        "下午": "卞午",
        "Mon to Fri: 10": "Mon to 10",
        "下午 2:00午膳": "2:00午膳",
        "下個": "下一個",
        "daily": "每日",
        "same day": "同日",
        "working day": "工作日",
        "{{special}}": /(日間賽馬|保養)日/g,
        "下午6時30分": "下午6時3 0分",
        "09:00 a.m.to 07:30 p.m. Except opening at 09:30 a.m. on Tue & Fri": "09:00 a.m.\\*\\* to 07:30 p.m.",
        "上午9時 至下午7時30分。除星期二和星期五由上午9時30分開放": "上午9時\\*\\* 至下午7時30分",
        "tue and fri 09:30am to 06:30pm": "Except opening at 09:30 a.m. on Tue & Fri",
        "星期二和五由上午9時30分至下午6時30分開放": "除星期二和星期五由上午9時30分開放",
        "minutes": /\d+\s*(minute|分鐘)/gi,
        "非公假": /non(-|\s)*public holiday|非公眾假期/gi,
        "{{order}}": /第[0-9一二三四五六七八九十]+|\d?1st|\d?2nd|\d?3rd|[0-9]+th|初[一二三四五六七八九十]+|session \d+/gi,
        "{{replace}}": /ceremonies|Space-\d|[0-9一二三四五六七八九十]+\s*(month|月份?)|\(\d+\)|[0-9.]+ hour per session|以[0-9.]+小時([0-9.]分+)?為1節計算|(AMS on Sunday and Public Holiday|If (.*) falls on a public holiday|如(.*)(為|適逢)公眾假期|Weekly Cleansing Day|每(周|週)大清(潔日|洗)|Session breaks|暫停開放時段)(.*)/gi,
        "{{exclude-a}}": /((星期)?[一二三四五六日](、|及|\s)*)*公(衆|眾)假期(除外|休息)/gi,
        "{{exclude-b}}": /((星期)?[一二三四五六日](、|及|\s)*)(除外|休息)/gi,
        "{{exclude-c}}": /(except|exclude|excluding|closed? on)\s*(((mon(day)*|tue(sday)*|wed(nesday)*|thu(rsday)*|fri(day)*|sat(urday)*|sun(day)*|weekend|weekday)s?(and|&|,|\s)*)*(public|general) holiday|p\.h\.)/gi,
        "{{exclude-d}}": /(except|exclude|excluding|closed? on)\s*(((mon(day)*|tue(sday)*|wed(nesday)*|thu(rsday)*|fri(day)*|sat(urday)*|sun(day)*|weekend|weekday)s?(and|&|,|\s)*))/gi,
    };
    tempStr = tempStr.replace(/<br[\/ ]*>/gi, " ");
    for (let key in customFix) {
        let regex;
        if (typeof customFix[key] === "string") {
            regex = new RegExp(customFix[key], "gi");
        } else {
            regex = customFix[key];
        }
        if (key.indexOf("{{exclude") != -1 && regex.test(tempStr)) {
            unavailable = Object.keys(regexWeek).filter(u => tempStr.match(regex).reduce((p, c) => p || regexWeek[u].test(c), false))
        }
        tempStr = tempStr.replace(regex, key)
    }


    if (/24\s*小\s*時|24\s*(hour|hr)s?|全日|full day/i.test(tempStr)) {
        for (let key in available) {
            available[key] = true
        }
        return available;
    }

    // process all time
    time = tempStr.match(/(([上下正中]午|[早晚]上)?\s*([0-9一二三四五六七八九十]+\s*時[正]?\s*([0-9一二三四五六七八九十]+\s*分)?|[0-9]{1,2}:?[0-9]{0,2})(\s*([apmn.]{2,4}|noon))?)|(午夜|midnight)/gi)
    if (time) {
        time = time.map((v, i) => {
            let hour, min = 0,
                morning = false,
                hour24 = true,
                processed = false;
            if (/上午|am|早上/.test(v.replace(/\./gi, ""))) {
                morning = true;
                hour24 = false;
                processed = true;
            } else if (/[下正中]午|pm|nn|noon|晚上/i.test(v.replace(/\./g, ""))) {
                hour24 = false;
                processed = true;
            } else if (/午夜|midnight/i.test(v.replace(/\./g, ""))) {
                processed = true;
                time[i] = "24:00";
            }
            tempStr = tempStr.replace(v, "{{" + (processed ? "TIME" : "time") + i + "}}");
            if (m = time[i].match(/([0-9一二三四五六七八九十]+)\s*時[正]?\s*(([0-9一二三四五六七八九十]+)\s*分)?/)) {
                let n;
                if (/[0-9]+/.test(m[1])) {
                    hour = parseInt(m[1]);
                } else if (/[一二三四五六七八九十]+/.test(m[1])) {
                    n = m[1].match(/(([一二三四五六七八九])?(十))?([一二三四五六七八九])?/);
                    hour = (!!n[1] ? (!!n[2] ? chiNum[n[2]] : 1) * 10 : 0) + (!!n[4] ? chiNum[n[4]] : 0);
                } else {
                    hour = m[1];
                }
                if (!!m[3]) {
                    if (/[0-9]+/.test(m[3])) {
                        min = parseInt(m[3]);
                    } else if (/[一二三四五六七八九十]+/.test(m[3])) {
                        n = m[3].match(/(([一二三四五六七八九])?(十))?([一二三四五六七八九])?/);
                        min = (!!n[1] ? (!!n[2] ? chiNum[n[2]] : 1) * 10 : 0) + (!!n[4] ? chiNum[n[4]] : 0);
                    } else {
                        min = m[3];
                    }
                }
            } else if (m = time[i].match(/([0-9]{1,2}):?([0-9]{0,2})/)) {
                hour = parseInt(m[1]);
                if (!!m[2]) min = parseInt(m[2])
            }
            if (!hour24) {
                if (morning && hour >= 12) morning = false;
                if (hour >= 12) hour -= 12;
                if (!morning) hour += 12;
            }
            return ("00" + hour).slice(-2) + ":" + ("00" + min).slice(-2)
        })
        if (m = tempStr.match(/(\{\{time(\d+)\}\})( |to|至|-)+(\{\{time(\d+)\}\})/gi)) {
            m.map(v => {
                let n = v.match(/\{\{time(\d+)\}\}/gi),
                    t1 = time[n[0].match(/(\d+)/)[0]],
                    t2 = time[n[1].match(/(\d+)/)[0]],
                    h1 = parseInt(t1.slice(0, 2)),
                    h2 = parseInt(t2.slice(0, 2));
                if (h1 > h2 && h1 >= 12 && h2 < 12) {
                    if (!/TIME/.test(n[1])) h2 += 12;
                }
                time[n[1].match(/(\d+)/)[0]] = h2 + t2.slice(2);
            })
        }
    }

    // process all weekday
    weekday = tempStr.match(/(星期)*[一二三四五六日]|mon(days?)*|tue(sdays?)*|wed(nesdays?)*|thu(rsdays?)*|fri(days?)*|sat(urdays?)*|sun(days?)*|(public|general) holiday|p\.h\.|公(衆|眾)假期/gi)
    if (weekday) {
        weekday = weekday.map((v, i) => {
            tempStr = tempStr.replace(v, "{{day" + i + "}}");
            return Object.keys(regexWeek).filter(u => regexWeek[u].test(v))[0]
        })
        if (m = tempStr.match(/(\{\{day(\d+)\}\})( |to|至|-)+(\{\{day(\d+)\}\})/gi)) {
            m.map(v => {
                let n = v.match(/(\{\{day(\d+)\}\})( |to|至|-)+(\{\{day(\d+)\}\})/i),
                    s = n[2],
                    e = n[5],
                    include = false,
                    start = weekday[s],
                    end = weekday[e];
                Object.keys(regexWeek).map(u => {
                    if (u == end) {
                        include = false;
                    } else if (include && unavailable.indexOf(u) == -1) {
                        weekday.push(u)
                        tempStr = tempStr.replace("{{day" + s + "}}", "{{day" + s + "}}{{day" + (weekday.length - 1) + "}}")
                    } else if (u == start) {
                        include = true;
                    };
                })
            })
        }
    }
    if (!weekday && !time) return str;

    if (m = tempStr.match(/\{\{(day|time)\d+\}\}/gi)) {
        let hasTime = false;
        m.map(v => {
            if (/time/i.test(v)) hasTime = true;
            else if (/day/.test(v) && hasTime) {
                hasTime = false;
                index++;
            }
            if (!(index in result)) result[index] = {
                weekday: [],
                time: []
            }
            if (/day/.test(v)) result[index].weekday.push(weekday[v.match(/\d+/)[0]])
            if (/time/i.test(v)) result[index].time.push(time[v.match(/\d+/)[0]])
        })
    }
    let specified = Object.keys(result).reduce((p, c) => p.concat(result[c].weekday), []),
        reversed = false,
        respecified = [];
    if (specified.length != specified.filter((v, i, l) => l.indexOf(v) == l.lastIndexOf(v)).length) available._multiple = true;
    for (let key in result) {
        if (reversed && key != "0") {
            result[key].weekday = result[key].weekday.filter(v => respecified.indexOf(v) == -1);
        }
        if (result[key].weekday.length == 0) {
            if (specified.indexOf("mon") != -1 && specified.indexOf("tue") != -1 && specified.indexOf("wed") != -1 && specified.indexOf("thu") != -1 && specified.indexOf("fri") != -1 && key == "0") {
                respecified = ["mon", "tue", "wed", "thu", "fri"];
                result[key].weekday = [...respecified];
                reversed = true;
            } else if (reversed) {
                result[key].weekday = specified.filter(v => respecified.indexOf(v) == -1);
                respecified = [...specified];
            } else {
                result[key].weekday = Object.keys(regexWeek).filter(v => specified.indexOf(v) == -1 && unavailable.indexOf(v) == -1)
            }
        }
        result[key].weekday.map(u => {
            if (result[key].time.length == 0) {
                available[u] = false;
            } else {
                available[u] = result[key].time.sort()
                    .filter((v, i, l) => l.indexOf(v) == l.lastIndexOf(v))
                    .reduce((p, c, i) => p += (i == 0 ? "" : i % 2 == 1 ? "-" : ";") + c, "")
                    .split(";");
            }

        })
    }
    return available;
}

function ParseSearchFields(data, config) {
    let temp;
    config = config || {};
    if (data && typeof data === "object") {
        temp = {};
        if (config.value) {
            for (let key in config.value) {
                if (key in data) {
                    let name = config.value[key].name || key,
                        value = config.value[key].accepted[data[key]];
                    temp[name] = typeof value !== "undefined" ? value : data[key];
                    if (name in data) delete data[name];
                    delete data[key];
                }
            }
        }
        if (config.boolean) {
            config.boolean.map(item => {
                let key = item,
                    name = item;
                if (typeof item == "object") {
                    key = item.key;
                    name = item.name;
                }
                if (key in data) {
                    temp[name] = data[key] == true;
                    delete data[key];
                }
            })
        }
        if (config.boundary) {
            config.boundary.map(item => {
                let key = item,
                    name = item;
                if (typeof item == "object") {
                    key = item.key;
                    name = item.name;
                }
                if (key in data) {
                    let arr = data[key];
                    if (typeof arr == "string") {
                        arr = arr.split(",");
                    }
                    if (Array.isArray(arr)) {
                        if (arr.length == 2) {
                            temp[name] = [];
                            arr.map(v => {
                                if (Array.isArray(v)) {
                                    if (v.length == 2) {
                                        temp[name].push(v)
                                    }
                                } else if (typeof v === "object") {
                                    if ("northing" in v && "easting" in v) {
                                        temp[name].push([
                                            v.easting,
                                            v.northing,
                                        ])
                                    } else if ("longitude" in v && "latitude" in v) {
                                        temp[name].push([
                                            v.longitude,
                                            v.latitude,
                                        ])
                                    }
                                }
                            })
                        } else if (arr.length == 4) {
                            temp[name] = [
                                [arr[0], arr[1]],
                                [arr[2], arr[3]],
                            ];
                        }
                    }
                    delete data[key];
                }
            })
        }
        if (config.rename) {
            for (let key in config.rename) {
                if (key in data) {
                    let name = config.rename[key];
                    if (name in data) delete data[name];
                    temp[name] = data[key];
                    delete data[key];
                }
            }
        }
        for (let key in data) {
            temp[key] = data[key];
        }
    } else if (typeof data !== "undefined") {
        temp = data;
    }
    return temp;
}

module.exports = {
    APIRequest,
    CSVFetch,
    XMLFetch,
    MatchData,
    StrToWeekTime,
    ReplaceURL,
    RenameFields,
    GetDataJson,
    UpdateDataJson,
    HasDataJson,
    SearchDataJson,
    ValidateParameters,
    ParseSearchFields,
    Equal: _identical,
    IsBetween: _inRange
}