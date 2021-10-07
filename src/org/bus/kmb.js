// https://data.etabus.gov.hk/datagovhk/kmb_eta_data_dictionary.pdf
// https://data.etabus.gov.hk/datagovhk/kmb_eta_api_specification.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://data.etabus.gov.hk/v1/transport/kmb/{type}/{data}";

const ENDPOINT = {
    "route": "{route}/{dir}/{service}",
    "route-stop": "{route}/{dir}/{service}",
    "stop": "{stop}",
    "eta": "{stop}/{route}/{service}",
    "stop-eta": "{stop}",
    "route-eta": "{route}/{service}",
}
const VALID = {
    type: /^(route|route-stop|stop|eta|stop-eta|route-eta)$/
}
const VALID_OPT = {
    stop: /^[A-z0-9]{16}$/,
    route: /^[A-z0-9]+$/,
    dir: /^(inbound|outbound)$/,
    service: /^\d+$/,
}
const PARAMS = {
    type: "route"
}
const FIELDS = {
    regex: {
        "^orig": "origin",
        "^dest": "destination",
        "^rmk": "remarks",
        "^(bound|dir)$": "direction",
    },
    number: {
        "service_type": "service",
        "seq": "seq",
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
            accepted: ["route", "route-stop", "stop", "eta", "stop-eta", "route-eta"]
        },
        dir: {
            accepted: ["inbound", "outbound"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (!result.error && /^(stop|eta|stop-eta)$/.test(params.type) && !("stop" in params)) {
        result.error = true;
        result.message = "Missing stop";
    }
    if (!result.error && /^route|^eta$/.test(params.type)) {
        if (!("route" in params)) {
            if (params.type === "route") {
                params.route = "";
                params.service = "";
                params.dir = "";
            } else {
                result.error = true;
                result.message = "Missing route";
            }
        } else if (!("service" in params)) {
            result.error = true;
            result.message = "Missing service";
        }
    }
    if (!result.error && /^(route|route-stop)$/.test(params.type) && !("dir" in params)) {
        result.error = true;
        result.message = "Missing dir";
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
            } else if (key === "direction") {
                temp[key] = item[key] === "I" ? 0 : 1;
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
        result = result.sort((a, b) => a.seq - b.seq)
            .map(v => ({
                id: v._id,
                seq: v.seq,
            }));
    } else if (/eta/.test(type)) {
        let handleETA = arr => {
            return arr.sort((a, b) => a.eta.isBefore(b.eta))
                .map(v => {
                    v.eta = v.eta.format("YYYY-MM-DD HH:mm:ss");
                    return v;
                });
        }

        if (type === "route-eta") {
            let seqs = {};
            result.map(item => {
                if (!seqs[item.seq]) seqs[item.seq] = [];
                seqs[item.seq].push(item);
            })
            result = Object.keys(seqs)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(seq => handleETA(seqs[seq]))
        } else {
            result = handleETA(result);
        }
    }
    return result;
}

module.exports = search;