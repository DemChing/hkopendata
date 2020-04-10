// https://www.ogcio.gov.hk/en/our_work/community/common_wifi_branding/wi-fi-hk-locations-data-dictionary-en.pdf

const cmn = require("../../common");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://www.ogcio.gov.hk/en/our_work/community/common_wifi_branding/{type}.json";

const VALID = {
    type: /^(organisations|non-fixed-wi-fi-hk-locations|fixed-wi-fi-hk-locations)$/
};
const PARAMS = {
    type: "organisations",
}
const FIELDS = {
    regex: {
        "Organisation(.+)": "$1",
        "Location(.+)": "$1",
        "^(VehicleTypeName|VenueType)": "type",
        "ImagePath$": "",
        "^Area": "region",
        "^MoreInformation": "otherInfo"
    },
    text: {
        "Hotline": "tel",
        "SupportHotline": "tel",
        "SupportEmail": "email",
    },
    number: {
        "NumberOfHotspots": "hotspotNo"
    }
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["organisations", "non-fixed-wi-fi-hk-locations", "fixed-wi-fi-hk-locations"]
        },
    }
}

function validateParameters(params) {
    params = cmn.ParseSearchFields(params, SEARCH_CONFIG);
    let result = cmn.ValidateParameters(params, VALID);
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
        });
        if (processed.error) {
            reject(processed);
        } else {
            cmn.APIRequest(cmn.ReplaceURL(BASE_URL, processed.data))
                .then((res) => {
                    resolve(processData(res, opts));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let result = [];
    data.map((item) => {
        let temp = {};
        item = cmn.RenameFields(item, FIELDS);
        for (let key in item) {
            let m, ckey = key.toCamelCase();
            if (!/FileName|MimeType/.test(key)) {
                if (m = key.match(/(.+)(EN|TC|SC)/)) {
                    ckey = ckey.replace(m[2], "")
                    if (!(ckey in temp)) temp[ckey] = {};
                    temp[ckey][m[2].toLowerCase()] = item[key];
                } else if (/Longitude|Latitude/.test(key)) {
                    if (!("coordinate" in temp)) temp.coordinate = {};
                    temp.coordinate[ckey] = item[key];
                } else {
                    temp[`${ckey == "id" ? "_" : ""}${ckey}`] = item[key];
                }
            }
        }

        for (let key in temp) {
            if (/icon|logo/.test(key)) {
                if (!("images" in temp)) temp.images = {}
                temp.images[key] = temp[key];
                delete temp[key];
            } else if (key == "coordinate") {
                temp[key] = new Coordinate(temp[key])
            }
        }
        result.push(temp)
    })
    return result
}

module.exports = search