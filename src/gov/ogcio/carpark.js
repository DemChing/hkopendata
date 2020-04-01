// https://resource.data.one.gov.hk/ogcio/carpark/Parking_Vacancy_Data_Specification.pdf

const cmn = require("../../common");
const {
    Carpark
} = require("../../_class");
const BASE_URL = "https://api.data.gov.hk/v1/carpark-info-vacancy";

const VALID = {}
const VALID_OPT = {
    lang: /^(en_US|zh_TW|zh_CN)$/,
    data: /^(info|vacancy)$/,
    carparkIds: /^[0-9a-z,]+$/,
    vehicleTypes: /^(privateCar|LGV|HGV|coach|motorCycle|CV)$/,
    extent: /^[0-9.]+,[0-9.]+,[0-9.]+,[0-9.]+$/
}
const PARAMS = {
    lang: "en_US",
    data: "info"
}
const FIELDS = {
    text: {
        "park_Id": "_id",
        "carpark_Type": "type",
        "contactNo": "tel",
        "facilities": "facility",
        "streetName": "street",
        "buildingName": "building",
        "subDistrict": "location",
        "dcDistrict": "district",
        "modifiedDate": "lastUpdate",
        "creationDate": "createAt",
        "openingHours": "opening",
        "opening_status": "isOpened",
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
                sc: "zh_CN",
                en: "en_US"
            }
        },
        type: {
            name: "data",
            accepted: ["info", "vacancy"]
        },
        vehicle: {
            name: "vehicleTypes",
            accepted: ["privateCar", "LGV", "HGV", "coach", "motorCycle", "CV"]
        },
    },
    boundary: ["boundary"]
}

function parseSearchFields(params) {
    let temp = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    if ("id" in temp) {
        if (Array.isArray(temp.id)) {
            temp.carparkIds = temp.id.join();
        } else {
            temp.carparkIds = temp.id;
        }
        delete temp.id;
    }
    if ("boundary" in temp) {
        temp.extent = temp.boundary.map(v => v.join()).join()
        delete temp.boundary;
    }
    return temp;
}

function validateParameters(params) {
    params = parseSearchFields(params);
    let result = cmn.ValidateParameters(params, VALID, VALID_OPT);
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
                    resolve(processData(res.results, opts));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let result = [];
    if (Array.isArray(data)) {
        data.map(carpark => {
            let temp = cmn.RenameFields(carpark, FIELDS);
            result.push(new Carpark(temp))
        })
    } else {
        for (let key in data) {
            let temp = cmn.RenameFields(data[key], FIELDS);
            if ("address" in temp) {
                temp.address = cmn.RenameFields(temp.address, FIELDS)
            }
            if ("latitude" in temp && "longitude" in temp) {
                temp.coordinates = [temp.longitude, temp.latitude];
                delete temp.longitude;
                delete temp.latitude;
            }
            temp.isOpened = temp.isOpened == "OPEN";
            delete temp.lang;
            result.push(new Carpark(temp));
        }
    }
    return result
}

module.exports = search