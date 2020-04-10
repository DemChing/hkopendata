// https://www.nwstbus.com.hk/datagovhk/bus_eta_spi_specifications.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://rt.data.gov.hk/v1/transport/citybus-nwfb/{type}/{data}";

const ENDPOINT = {
    "company": "{company}",
    "route": "{company}/{route}",
    "route-stop": "{company}/{route}/{dir}",
    "stop": "{stop}",
    "eta": "{company}/{stop}/{route}",
}
const VALID = {
    type: /^(company|route|route-stop|stop|eta)$/
}
const VALID_OPT = {
    company: /^(CTB|NWFB)$/,
    stop: /^[A-z0-9]{6}$/,
    route: /^[A-z0-9]+$/,
    dir: /^(inbound|outbound)$/,
}
const PARAMS = {
    type: "route"
}
const FIELDS = {
    regex: {
        "^orig": "origin",
        "^dest": "destination",
        "^rmk": "remarks"
    },
    text: {
        "co": "companyCode",
        "url": "website",
        "stop": "_id",
    },
    latitude: ["lat"],
    longitude: ["long"],
};
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "route-stop", "eta", "stop", "company"]
        },
        dir: {
            accepted: ["inbound", "outbound"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (/^(stop|eta)$/.test(params.type) && !("stop" in params)) {
        result.error = true;
        result.message = "Missing stop";
    }
    if (/route|^eta$/.test(params.type) && !("route" in params)) {
        if (params.type == "route") {
            params.route = "";
        } else {
            result.error = true;
            result.message = "Missing route";
        }
    }
    if (params.type == "route-stop" && !("dir" in params)) {
        result.error = true;
        result.message = "Missing dir";
    }
    if (params.type != "stop" && !("company" in params)) {
        result.error = true;
        result.message = "Missing company";
    }
    if (!result.error) {
        if ("route" in params) params.route = params.route.toUpperCase();
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
                    resolve(processData(res.data, params.type))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, type) {
    if (!Array.isArray(data)) data = [data];

    let result = [];
    data.map(item => {
        let temp = {};
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            let m;
            if (m = key.match(/^(.+)_(en|tc|sc)$/)) {
                if (!(m[1] in temp)) temp[m[1]] = {};
                temp[m[1]][m[2]] = item[key];
            } else if (key == "eta") {
                temp[key] = moment(item[key]);
            } else if (!/data_timestamp|eta_seq/.test(key)) {
                temp[key] = item[key];
            }
        }

        if ("coordinate" in temp) {
            temp.coordinate = new Coordinate(temp.coordinate)
        }
        result.push(temp);
    })

    if (type == "route-stop") {
        result = result.sort((a, b) => a.seq - b.seq).map(v => v._id);
    } else if (type == "eta") {
        result = result.sort((a, b) => a.eta.isBefore(b.seq))
            .map(v => {
                let t = {
                    eta: v.eta.format("YYYY-MM-DD HH:mm:ss"),
                    lowFloor: true,
                    gps: true
                };
                if ("remarks" in v) {
                    t.remarks = v.remarks;
                }
                return t;
            });
    }
    return result;
}

module.exports = search;