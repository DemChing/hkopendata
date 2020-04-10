// https://www.nwstbus.com.hk/datagovhk/bus_eta_spi_specifications.pdf

const cmn = require("../../common");
const moment = require("../../moment");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://rt.data.gov.hk/v1/transport/nlb/{data}";

const ENDPOINT = {
    "route": "route.php?action=list",
    "route-stop": "stop.php?action=list",
    "eta": "stop.php?action=estimatedArrivals",
}
const VALID = {
    type: /^(route|route-stop|eta)$/
}
const VALID_OPT = {
    stop: /^[0-9]+$/,
    route: /^[A-z0-9]+$/,
}
const PARAMS = {
    type: "route",
}
const FIELDS = {
    regex: {
        "^(stop|route)": "",
        "Route$": "",
    },
    text: {
        "wheelChair": "lowFloor",
        "estimatedArrivalTime": "eta",
        "noGPS": "gps",
    },
    latitude: ["latitude"],
    longitude: ["longitude"],
};
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["route", "route-stop", "eta"]
        },
    },
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);

    if (params.type == "eta" && !("stop" in params)) {
        result.error = true;
        result.message = "Missing stop";
    }
    if (/^(route-stop|eta)$/.test(params.type) && !("route" in params)) {
        result.error = true;
        result.message = "Missing route";
    }
    if (!result.error) {
        if ("stop" in params) {
            params.stopId = params.stop;
            delete params.stop;
        }
        if ("route" in params) {
            params.routeId = params.route.toUpperCase();
            delete params.route;
        }
        result.data = {
            ...params,
            ...{
                data: ENDPOINT[params.type]
            }
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
            cmn.APIRequest(cmn.ReplaceURL(BASE_URL, params), JSON.stringify(params), true)
                .then((res) => resolve(processData(res, params)))
                .catch((err) => reject(err))
        }
    })
}

function processData(data, params) {
    let dataKey = "",
        type = params.type;
    switch (type) {
        case "eta":
            dataKey = "estimatedArrivals";
            break;
        case "route-stop":
            dataKey = "stops";
            break;
        case "route":
            dataKey = "routes";
            break;
    }
    data = data[dataKey];
    if (!Array.isArray(data)) data = [data];

    let result = [];
    data.map(item => {
        let temp = {};
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            let m, ckey = key.toCamelCase();
            if (m = key.match(/^(.+)_(e|c|s)$/)) {
                ckey = m[1].toCamelCase();
                if (!(ckey in temp)) temp[ckey] = {};
                let l = "en";
                if (m[2] == "c") l = "tc";
                else if (m[2] == "s") l = "sc";
                temp[ckey][l] = item[key];
            } else if (/^fare/.test(key)) {
                if (!("fare" in temp)) temp.fare = {};
                temp.fare[/Holiday/.test(key) ? "ph" : "wd"] = item[key].parseNumber();
            } else if (/^(overnight|special)$/.test(key)) {
                temp[ckey] = !!item[key];
            } else if (key == "eta") {
                temp[ckey] = moment(item[key]);
            } else if (!/^(someDepartureObserveOnly|variantName|departed|generateTime)$/.test(ckey)) {
                temp[ckey] = item[key];
            }
        }
        if ("location" in temp) delete temp.location;
        if ("coordinate" in temp) {
            temp.coordinate = new Coordinate(temp.coordinate)
        }
        result.push(temp);
    })

    if (type == "route") {
        result = result.map(v => {
            let t = {
                _id: v.id,
                route: v.no,
                origin: {},
                destination: {},
                companyCode: "NLB"
            };
            for (let l in v.name) {
                let name = v.name[l].split(">");
                t.origin[l] = name[0].trim();
                t.destination[l] = name[1].trim();
            }
            return t;
        })
        if ("routeId" in params) {
            result = result.filter(v => v._id == params.routeId);
        }
    } else if (type == "eta") {
        result = result.sort((a, b) => a.eta.isBefore(b.seq))
            .map(v => {
                return {
                    eta: v.eta.format("YYYY-MM-DD HH:mm:ss"),
                    lowFloor: v.lowFloor,
                    gps: v.gps
                };
            });
    }
    return result;
}

module.exports = search;