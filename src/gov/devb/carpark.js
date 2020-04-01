// http://www.ekeo.gov.hk/filemanager/content/smart_city/common/smart_parking_open_api_specification_v1.0.pdf

const cmn = require("../../common");
const Carpark = require("../../_class").Carpark;
const BASE_URL = "https://sps-opendata.pilotsmartke.gov.hk/rest/getCarpark";

const VALID = {
    lang: /^(en_US|zh_TW)$/
};
const VALID_OPT = {
    carparkId: /^[0-9]+$/,
    carparkIds: /^[0-9,]+$/,
    carparkTypes: /^(multi-storey|off-street|metered)$/,
    vehicleTypes: /^(privateCar|LGV|HGV|coach|motorCycle)$/,
    fullload: /^(true|false)$/,
    extent: /^[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+$/
}
const PARAMS = {
    lang: "en_US"
}
const FIELDS = {
    text: {
        "contactNo": "tel",
        "facilities": "facility",
        "streetName": "street",
        "buildingName": "building",
        "subDistrict": "location",
        "dcDistrict": "district",
        "modifiedDate": "lastUpdate",
        "creationDate": "createAt",
        "openingHours": "opening",
        "remark": "remarks"
    },
    others: {
        "renditionUrls": "images"
    },
}
const SEARCH_CONFIG = {
    value: {
        lang: {
            accepted: {
                tc: "zh_TW",
                en: "en_US"
            }
        },
        vehicle: {
            name: "vehicleTypes",
            accepted: ["privateCar", "LGV", "HGV", "coach", "motorCycle"]
        },
        carpark: {
            name: "carparkTypes",
            accepted: ["multi-storey", "off-street", "metered"]
        }
    },
    boolean: [{
        key: "full",
        name: "fullload"
    }],
    boundary: ["boundary"]
}

function parseSearchFields(params) {
    let temp = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    if ("id" in temp) {
        if (Array.isArray(temp.id)) {
            temp.carparkIds = temp.id.join();
        } else if (typeof temp.id === "string") {
            if (/,/.test(temp.id)) temp.carparkIds = temp.id;
            else temp.carparkId = temp.id;
        } else if (typeof temp.id === "number") {
            temp.carparkId = temp.id;
        }
        delete temp.id;
    }
    if ("boundary" in temp) {
        temp.extent = temp.boundary.map(v => v.join()).join()
        delete temp.boundary;
    }
    return temp;
}

function validateParameters(params, opts) {
    params = parseSearchFields(params);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT),
        url = "Info",
        multiple = false;
    if ((!("carparkIds" in params) && !("carparkId" in params)) || "carparkIds" in params) {
        multiple = true;
    }
    if (opts && "type" in opts) {
        if (opts.type == "vacancy") {
            url = "Vacanc" + (multiple ? "ie" : "y");
        }
    }
    if (multiple) {
        url += "s";
    }
    url = BASE_URL + url;
    for (let key in params) {
        if (!multiple) {
            if (["carparkTypes", "vehicleTypes", "carparkIds", "extent"].indexOf(key) != -1) {
                delete params[key];
            }
        }
    }
    if (!multiple && !("carparkId" in params)) {
        result.error = true;
        result.message = "Missing carparkId";
    }
    if (!result.error) {
        result.data = {
            ...params
        }
        result.multiple = multiple
        result.url = url
    }
    return result;
}

function search(data, opts) {
    let url, multiple;
    return new Promise((resolve, reject) => {
        let processed = validateParameters({
                ...PARAMS,
                ...data
            }, opts),
            params;
        if (processed.error) {
            reject(processed);
        } else {
            params = processed.data;
            url = processed.url;
            multiple = processed.multiple;
            cmn.APIRequest(url, params)
                .then((res) => {
                    resolve(processData(res))
                })
                .catch((err) => reject(err))
        }
    })
}

function processCarpark(data) {
    let temp = cmn.RenameFields(data, FIELDS);
    for (let key in temp) {
        if (/^(address|heightLimits)$/.test(key)) {
            temp[key] = Array.isArray(temp[key]) ? temp[key].map(v => cmn.RenameFields(v, FIELDS)) : cmn.RenameFields(temp[key], FIELDS)
        }
    }
    return new Carpark(temp);
}

function processData(data, opts) {
    if (Array.isArray(data.results)) return data.results.map(v => processCarpark(v))
    return [processCarpark(data.results)]
}

module.exports = search