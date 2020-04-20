// https://data.housingauthority.gov.hk/dataset/emms/emms_housing_stock_data_dictionary.pdf

const fs = require("fs");
const cmn = require("../../common");
const Region = require("../../_class").Region;
const Coordinate = require("../../_class").Coordinate;
const BASE_URL = "https://data.housingauthority.gov.hk/psi/rest/export/ha_prhs/{type}/en/json";

const VALID = {
    type: /^ha_prhs_[a-hj-np-t]$/,
};
const PARAMS = {
    type: "ha_prhs_a",
}
const SEARCH_CONFIG = {
    value: {
        type: {
            accepted: ["ha_prhs_a", "ha_prhs_b", "ha_prhs_c", "ha_prhs_d", "ha_prhs_e", "ha_prhs_f", "ha_prhs_g", "ha_prhs_h", "ha_prhs_j", "ha_prhs_k", "ha_prhs_l", "ha_prhs_m", "ha_prhs_n", "ha_prhs_p", "ha_prhs_q", "ha_prhs_r", "ha_prhs_s", "ha_prhs_t"]
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
    opts = opts || {};
    return new Promise((resolve, reject) => {
        let processed = validateParameters({
            ...PARAMS,
            ...data
        });
        if (processed.error) {
            reject(processed);
        } else {
            params = processed.data;

            let res = cmn.GetDataJson(`flats/${params.type}`);
            if (!(opts.update || Object.keys(res).length == 0)) {
                resolve(processItem(res));
            } else {
                cmn.APIRequest(cmn.ReplaceURL(BASE_URL, processed.data))
                    .then((res) => {
                        resolve(processData(res, params.type));
                    })
                    .catch((err) => reject(err))
            }
        }
    })
}

function processData(data, name) {
    let allItems = {},
        estates = {};
    data.data.map((item) => {
        let temp = {},
            estate, building;
        for (let key in item) {
            let m, n;
            if (m = key.match(/(longitude|latitude)/)) {
                temp[m[1]] = item[key]
            } else if (m = key.match(/(english|chinese)/)) {
                n = key.replace(m[1] + "_", "");
                if (!(n in temp)) temp[n] = {};
                temp[n][m[1] == "english" ? "en" : "tc"] = item[key];
            } else if (key == "internal_floor_area") {
                temp.floorSize = parseFloat(item[key]);
            } else if (key == "avail_of_elevator_services") {
                temp.elevator = item[key] == "Y"
            } else if (key == "flat_number") {
                temp.id = item[key];
            }
        }

        estate = temp.estate_name;
        building = temp.name_of_block;

        if (!("region" in allItems)) allItems.region = temp.region_name;
        if (!("district" in allItems)) allItems.district = temp.district_name;
        if (!(estate.en in estates)) {
            estates[estate.en] = {
                name: estate,
                lat: temp.latitude,
                long: temp.longitude,
                building: {}
            };
        }
        if (!(building.en in estates[estate.en].building)) estates[estate.en].building[building.en] = {
            name: building,
            flats: [],
            size: []
        };
        if (estates[estate.en].building[building.en].size.indexOf(temp.floorSize) == -1) estates[estate.en].building[building.en].size.push(temp.floorSize)
        estates[estate.en].building[building.en].flats.push(`${temp.id} ${estates[estate.en].building[building.en].size.indexOf(temp.floorSize)} ${temp.elevator ? 1 : ""}`.trim())
    })
    for (let e in estates) {
        let temp = {
            name: estates[e].name,
            lat: estates[e].lat,
            long: estates[e].long,
            building: [],
        }
        for (let b in estates[e].building) {
            temp.building.push(estates[e].building[b])
        }
        if (!("estate" in allItems)) allItems.estate = []
        allItems.estate.push(temp)
    }
    if (!fs.existsSync("data/flats")) {
        fs.mkdirSync("data/flats");
    }
    fs.writeFile(`data/flats/${name}.json`, JSON.stringify(allItems), () => {})
    return processItem(allItems);
}

function processItem(item) {
    if (Object.keys(item) == 0) return {};
    let region = new Region({
        name: item.region,
    })
    let district = region.addDistrict({
        name: item.district,
    });
    item.estate.map(e => {
        let estate = district.addEstate({
            name: e.name,
            coordinate: new Coordinate({
                latitude: e.lat,
                longitude: e.long,
            })
        });
        e.building.map(b => {
            let building = estate.addBuilding({
                name: b.name
            })
            b.flats.map(f => {
                let arr = f.split(" ");
                building.addFlat({
                    name: arr[0],
                    size: b.size[arr[1]],
                    elevator: !!arr[2]
                })
            })
        })
    })
    return region;
}

module.exports = search