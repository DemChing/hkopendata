// https://www.geodetic.gov.hk/common/data/LP/DataDict_LP.pdf
// https://www.ogcio.gov.hk/tc/our_work/strategies/doc/Summary_of_Devices_and_Functions_on_Smart_Lampposts.pdf

const cmn = require("../../common");
const {
    Lamppost,
    UnitValue,
    Coordinate
} = require("../../_class");
const BASE_URL = "https://www.geodetic.gov.hk/lpapi/";

const VALID = {
    db: /^(ALL|LP|IB|EDS|NFC|RFID|GM)$/i
};
const VALID_OPT = {
    lp: /^[A-Z]{1,2}[0-9]{4}$/,
    n: /^[0-9.]+$/,
    e: /^[0-9.]+$/,
    lat: /^[0-9.]+$/,
    long: /^[0-9.]+$/,
    bufn: /^[0-9]+$/,
    bufe: /^[0-9]+$/,
    buflat: /^[0-9]+$/,
    buflong: /^[0-9]+$/,
}
const PARAMS = {
    db: "ALL"
}
const SEARCH_CONFIG = {
    value: {
        type: {
            name: "db",
            accepted: ["ALL", "LP", "IB", "EDS", "NFC", "RFID", "GM"]
        }
    },
    rename: {
        id: "lp"
    },
    boundary: ["boundary", "boundaryHK"]
}

function getMedianAndBuf(boundary) {
    let coor = new Coordinate({
            longitude: boundary[0][0],
            latitude: boundary[0][1]
        }),
        long = (boundary[0][0] + boundary[1][0]) / 2,
        lat = (boundary[0][1] + boundary[1][1]) / 2,
        buflong = Math.round(coor.distance(new Coordinate({
            longitude: long,
            latitude: boundary[0][1]
        })) * 1000),
        buflat = Math.round(coor.distance(new Coordinate({
            longitude: boundary[0][0],
            latitude: lat
        })) * 1000);
    return [
        [long, lat],
        [buflong, buflat]
    ]
}

function parseSearchFields(params) {
    let temp = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    if ("boundary" in temp) {
        let arr = getMedianAndBuf(temp.boundary);
        temp.long = arr[0][0];
        temp.lat = arr[0][1];
        temp.buflong = arr[1][0];
        temp.buflat = arr[1][1];
        delete temp.boundary;
    }
    if ("boundaryHK" in temp) {
        let arr = getMedianAndBuf(temp.boundaryHK);
        temp.e = arr[0][0];
        temp.n = arr[0][1];
        temp.bufe = arr[1][0];
        temp.bufn = arr[1][1];
        delete temp.boundaryHK;
    }
    return temp;
}

function validateParameters(params, opts) {
    params = parseSearchFields(params);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);
    if (("bufn" in params || "bufe" in params) && (!("n" in params) || !("e" in params))) {
        result.error = true;
        result.message = "Missing parameter: n/e. n and e must be specified when using bufn and bufe";
    }
    if (("buflat" in params || "buflong" in params) && (!("lat" in params) || !("long" in params))) {
        result.error = true;
        result.message = "Missing parameter: lat/long. lat and long must be specified when using buflat and buflong";
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
            params = processed.data;
            cmn.APIRequest(BASE_URL, params)
                .then((res) => {
                    resolve(processData(res, params.dataType));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let result = [],
        feature = {};
    data.map((item) => {
        let temp = {
                _type: "ogcio",
                report: {},
                coordinate: {},
                coordinateHK: {
                    _type: "tmerc",
                    _system: "hk1980"
                }
            },
            f = {};
        for (let key in item) {
            let m;
            if (key == "LP_NUM") {
                temp._id = item[key];
            } else if (m = key.match(/^LP_(LAT|LONG)$/)) {
                temp.coordinate[m[1].toLowerCase() + "itude"] = item[key];
            } else if (m = key.match(/^LP_(NORTH|EAST)$/)) {
                temp.coordinateHK[m[1].toLowerCase() + "ing"] = item[key];
            } else if (((m = key.match(/^BLE_(IB|EDS)$/)) || (m = key.match(/^(RFID|GM|NFC)$/))) && item[key].length > 0) {
                if (!(m[1] in feature)) feature[m[1]] = {};
                feature[m[1]][item.LP_NUM] = item[key];
            } else if (((m = key.match(/^BLE_(IB|EDS)_/)) || (m = key.match(/^(RFID|GM|NFC)_/)))) {
                if (!(m[1] in f)) f[m[1]] = {};
                f[m[1]][key] = item[key];
            }
        }
        for (let key in f) {
            if (!(key in feature)) feature[key] = {};
            if (!(temp._id in feature[key])) feature[key][temp._id] = [];
            feature[key][temp._id].push(f[key])
        }
        result.push(temp)
    })
    for (let key in feature) {
        for (let id in feature[key]) {
            let devices = feature[key][id].map(v => {
                let device = {
                    type: key.toLowerCase()
                };
                for (let k in v) {
                    let k2 = k.replace(/^(BLE_IB|BLE_EDS|GM|RFID|NFC)_/, "").toLowerCase();
                    if (v[k] !== null) {
                        if (/^(namespace|uuid)$/.test(k2)) {
                            device.group = v[k];
                        } else if (/^(tid|instant|uuid|uid)$/.test(k2)) {
                            device.id = v[k];
                        } else if (k2 == "tx") {
                            device.power = v[k];
                        } else if (/^(east|north)$/.test(k2)) {
                            if (!("coordinateHK" in device)) device.coordinateHK = {};
                            device.coordinateHK[k2 + "ing"] = v[k];
                        } else if (k2 == "hk80") {
                            let m = v[k].match(/HK80:([0-9.]+)N,([0-9.]+)E,([0-9.]+)H/);
                            device.coordinateHK = {
                                northing: m[1],
                                easting: m[2]
                            };
                            device.height = new UnitValue({
                                type: "length",
                                category: "metre",
                                value: m[3]
                            });
                        } else if (k2 == "geouri") {
                            let m = v[k].match(/geo:([0-9.]+),([0-9.]+)/);
                            device.coordinate = {
                                latitude: m[1],
                                longitude: m[2]
                            };
                        } else {
                            device[k2] = v[k];
                        }
                    }
                }
                if ("power" in device) {
                    device.power = new UnitValue({
                        type: "power",
                        category: "dbm",
                        value: device.power
                    })
                }
                if ("coordinate" in device) {
                    device.coordinate = new Coordinate(device.coordinate)
                }
                if ("coordinateHK" in device) {
                    device.coordinateHK._type = "tmerc";
                    device.coordinateHK._system = "hk1980";
                    device.coordinateHK = new Coordinate(device.coordinateHK)
                }
                return device
            });

            result.filter(v => v._id == id)[0].report[key.toLowerCase()] = devices;
        }
    }

    return result.map(v => new Lamppost(v));
}

module.exports = search