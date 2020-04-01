// https://data.housingauthority.gov.hk/dataset/hahdweb/ha_hahdweb_dataspec.pdf

const cmn = require("../../common");
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://data.housingauthority.gov.hk/psi/rest/criteriafilter/{type}/{lang}/json";

const VALID = {
    type: /^(prh-estates|hos-courts|shopping-centres|flatted-factory)$/,
    lang: /^(en|tc|sc)$/
};
const PARAMS = {
    type: "prh-estates",
    lang: "en"
};
const FIELDS = {
    text: {
        "estate_name": "name",
        "district_name": "district",
        "region_name": "region",
        "type_of_estate": "estateType",
        "type_of_block": "blockType",
        "name_of_block": "blockNames",
        "further_information": "remarks",
        "sold_under": "soldUnder",
    },
    number: {
        "no_of_blocks": "blockCount",
        "year_of_intake": "intakeYear",
        "year_of_completion": "completionYear",
        "no_of_floor": "floorCount",
        "storey": "floorCount"
    },
    minmax: {
        "flat_size_m2": "flatSize",
        "gross_floor_area_of_flt": "flatSize",
        "saleable_area_of_flats": "flatSize",
        "initial_sale_price": "initialPrice",
    },
    regex: {
        "[a-z_]+_website": "website"
    },
    latitude: ["map_latitude"],
    longitude: ["map_longitude"]
};
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["prh-estates", "hos-courts", "shopping-centres", "flatted-factory"]
        },
    },
};

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
            params = processed.data;
            cmn.APIRequest(cmn.ReplaceURL(BASE_URL, processed.data))
                .then((res) => {
                    resolve(processData(res));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let result = [];
    data.data.map((item) => {
        let tempItem = {},
            temp = {};
        for (let key in item) {
            tempItem[key.toLowerCase()] = item[key];
        }
        temp = cmn.RenameFields(tempItem, FIELDS);
        temp.management = {}
        for (let key in tempItem) {
            let m;
            if (["", "-"].indexOf(tempItem[key].trim()) == -1) {
                if (key == "estate_management_advisory_committee_emac") {
                    temp.management.emac = (tempItem[key] == "Formed" || tempItem[key] == "已成立")
                } else if (key == "owners_corporation") {
                    temp.management.ownerCorp = (tempItem[key] == "Formed" || tempItem[key] == "已成立")
                } else if (key.match(/_office$/)) {
                    temp.management.office = tempItem[key];
                } else if (m = key.match(/(property|carpark)_management/)) {
                    temp.management[m[1]] = tempItem[key];
                } else if (key == "no_of_rental_flats" || key == "no_of_flats") {
                    m = tempItem[key].match(/([0-9 ]+)/);
                    temp.flatCount = parseInt(m[1].replace(/\s/g, ""));
                } else if (key == "total_lettable_area") {
                    m = tempItem[key].match(/([0-9 ]+)/);
                    temp.lettableArea = parseInt(m[1].replace(/\s/g, ""));
                }
            }
        }
        temp.coordinate = new Coordinate(temp.coordinate);
        result.push(temp)
    })
    return result;
}

module.exports = search