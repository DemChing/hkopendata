// https://data.etagmb.gov.hk/static/GMB_ETA_API_Specification.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://data.etagmb.gov.hk/{type}/{data}";

const ENDPOINT = {
    "route": "{routeData}",
    "stop-route": "{stop}",
    "route-stop": "{routeId}/{routeSeq}",
    "stop": "{stop}",
    "eta": "{etaData}",
}
const VALID = {
    type: /^(route|stop-route|route-stop|stop|eta|stop-eta)$/
}
const VALID_OPT = {
    region: /^(HKI|KLN|NT)$/,
    route: /^[A-z0-9]+$/,
    routeId: /^[0-9]+$/,
    routeSeq: /^[0-9]+$/,
    stop: /^[0-9]+$/,
    stopSeq: /^[0-9]+$/,
}
const PARAMS = {
    type: "route"
}
const FIELDS = {
    regex: {
        "^orig": "origin",
        "^dest": "destination",
        "^.+_seq$": "seq",
        "^route_": "",
        "^stop_": "",
    },
    other: {
        "directions": "direction",
        "headways": "headway",
    }
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "stop-route", "route-stop", "stop", "eta", "stop-eta"]
        },
        region: {
            accepted: ["HKI", "KLN", "NT"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);
    params._type = params.type;

    if (!result.error && params.type === "route") {
        if ("routeId" in params) {
            params.routeData = '{routeId}';
            params._type = "route-info";
        } else if ("region" in params) {
            params.routeData = '{region}';
            if ("route" in params) {
                params.routeData += `/{route}`;
                params._type = "route-info";
            }
        } else {
            result.error = true;
            result.message = "Missing region";
        }
    }
    if (!result.error && params.type === "route-stop") {
        let error = result.error;
        if (!("routeId" in params)) {
            error = true;
            result.message = "Missing route id";
        } else if (!("routeSeq" in params)) {
            error = true;
            result.message = "Missing route sequence";
        }
        result.error = error;
    }
    if (!result.error && /^(stop|stop-eta|stop-route)$/.test(params.type) && !("stop" in params)) {
        result.error = true;
        result.message = "Missing stop";
    }
    if (!result.error && params.type === "eta") {
        if (!("routeId" in params)) {
            result.error = true;
            result.message = "Missing route id";
        } else {
            if ("stop" in params) {
                params.etaData = `{stop}`;
                params._type = "eta-list";
            } else if (!("routeSeq" in params)) {
                result.error = true;
                result.message = "Missing route sequence";
            } else if (!("stopSeq" in params)) {
                result.error = true;
                result.message = "Missing stop sequence";
            } else {
                params.etaData = `{routeSeq}/{stopSeq}`;
            }
        }
        if (!result.error && params.etaData) {
            params.etaData = `route-stop/{routeId}/${params.etaData}`;
        }
    }
    if (!result.error && params.type === "stop-eta") {
        params.type = "eta";
        params.etaData = "stop/{stop}";
    }
    if (!result.error) {
        result.data = {
            ...{
                data: ENDPOINT[params.type]
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
            cmn.APIRequest(cmn.ReplaceURL(BASE_URL, params))
                .then((res) => {
                    resolve(processData(res.data, params._type))
                })
                .catch((err) => reject(err))
        }
    })
}

function groupData(data) {
    if (Array.isArray(data)) return data.map(v => groupData(v));
    else if (typeof data !== "object" || data === null) return data;

    let temp = {};
    data = cmn.RenameFields(data, FIELDS);

    for (let key in data) {
        let m;
        if (typeof data[key] === "object") {
            data[key] = groupData(data[key]);
        }
        if (m = key.match(/^(.+)_(en|tc|sc)$/)) {
            if (!(m[1] in temp)) temp[m[1]] = {};
            temp[m[1]][m[2]] = data[key];
        } else if (key !== "data_timestamp") {
            temp[key] = data[key];
        }
    }
    return temp;
}

const Weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function processData(data, type) {
    let result = [];
    if (type === "route") {
        result = data.routes;
    } else if (type === "stop-route") {
        data.map(route => {
            let temp = {
                    routeId: route.route_id,
                    routeSeq: route.route_seq,
                    stopSeq: route.stop_seq,
                },
                item = groupData(route);
            for (let key in item) {
                if (!/(id|seq)$/.test(key)) {
                    temp[key] = item[key];
                }
            }
            result.push(temp);
        });
    } else if (type === "route-info") {
        data.map(item => {
            item = groupData(item);

            item.direction = item.direction.map(dir => {
                dir.headway = dir.headway.map(headway => {
                    let temp = {
                        applicableDay: {},
                        period: `${headway.start_time.slice(0, -3)}-${headway.end_time.slice(0, -3)}`,
                    };
                    headway.weekdays.map((day, i) => temp.applicableDay[Weekdays[i]] = day);
                    temp.applicableDay.ph = headway.public_holiday;

                    if (headway.frequency) {
                        let freq = headway.frequency;
                        if (headway.frequency_upper) freq += `-${headway.frequency_upper}`;
                        temp.frequency = freq;
                    }

                    return temp;
                })
                return dir;
            })

            result.push(item)
        })
    } else if (type === "route-stop") {
        result = groupData(data.route_stops);
    } else if (type === "stop") {
        let item = groupData(data),
            temp = {};
        for (let key in item) {
            if (key === "coordinates") {
                if (item[key].wgs84) {
                    temp.coordinate = new Coordinate(item[key].wgs84);
                }
                if (item[key].hk80) {
                    temp.coordinateHK = new Coordinate({
                        _type: "tmerc",
                        _system: "hk1980",
                        northing: item[key].hk80.longitude,
                        easting: item[key].hk80.latitude,
                    });
                }
            } else if (key === "enabled") {
                temp.suspended = !item[key];
            } else {
                temp[key] = item[key];
            }
        }
        result.push(temp);
    } else if (/eta/.test(type)) {
        data = !Array.isArray(data) ? [data] : data;
        data.map(item => {
            item.eta.map(eta => {
                eta = groupData(eta);

                let temp = {};
                if (item.route_id) temp.routeId = item.route_id;
                if (item.route_seq) temp.routeSeq = item.route_seq;
                if (item.stop_seq) temp.stopSeq = item.stop_seq;
                for (let key in eta) {
                    if (key === 'timestamp') {
                        temp.eta = moment(eta[key]).format('YYYY-MM-DD HH:mm:ss')
                    } else if (!/^(seq|diff)$/.test(key)) {
                        temp[key] = eta[key];
                    }
                }
                result.push(temp)
            })
        })
    }
    return result
}

module.exports = search;