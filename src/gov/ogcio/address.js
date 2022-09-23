// https://www.als.ogcio.gov.hk/docs/Data_Dictionary_for_ALS_TC.pdf

const cmn = require("../../common");
const { Location, Coordinate } = require("../../_class");
const BASE_URL = "https://www.als.ogcio.gov.hk/lookup";

const VALID = {
    n: /^[0-9]+$/,
    q: /^.+$/
};
const PARAMS = {
    n: 1,
    q: "",
}
const SEARCH_CONFIG = {
    rename: {
        query: "q",
        limit: "n"
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
            params = processed.data;
            cmn.APIRequest(BASE_URL, params)
                .then((res) => {
                    resolve(processData(res));
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data) {
    let result = [],
        hasJSON = cmn.HasDataJson("districts");
    data.SuggestedAddress.map((item) => {
        let temp = {
            _raw: data.RequestAddress.AddressLine[0],
            _score: item.ValidationInformation.Score,
            coordinate: {},
            coordinateHK: {},
        };
        for (let key in item.Address.PremisesAddress) {
            let i = item.Address.PremisesAddress[key],
                m;
            if (key == "GeospatialInformation") {
                temp.coordinate = new Coordinate({
                    latitude: i.Latitude,
                    longitude: i.Longitude
                });
                temp.coordinateHK = new Coordinate({
                    _type: "tmerc",
                    _system: "hk1980",
                    northing: i.Northing,
                    easting: i.Easting
                });
            } else if (m = key.match(/(Eng|Chi)PremisesAddress/)) {
                let l = m[1],
                    lang = l == "Eng" ? "en" : "tc";
                if ((l + "Estate") in i && (l + "Phase") in i[l + "Estate"]) {
                    i[l + "Phase"] = {
                        ...i[l + "Estate"][l + "Phase"]
                    };
                    delete i[l + "Estate"][l + "Phase"];
                }
                for (let key2 in i) {
                    if (key2 == "BuildingName") {
                        if (!("building" in temp)) temp.building = {};
                        temp.building[lang] = i[key2];
                    } else if (m = key2.match(/(Eng|Chi)([A-z]+)/)) {
                        let k = m[2].toLowerCase();
                        if (!(k in temp)) temp[k] = {};
                        for (let key3 in i[key2]) {
                            if (m = key3.match(/([A-z]+)Name/)) {
                                let k2 = m[1].toCamelCase();
                                if (k2 == k) {
                                    temp[k][lang] = i[key2][key3];
                                } else {
                                    if (k2 == "location") {
                                        if (!(k2 in temp)) temp[k2] = {};
                                        temp[k2][lang] = i[key2][key3];
                                    } else {
                                        if (!(k2 in temp[k])) temp[k][k2] = {};
                                        temp[k][k2][lang] = i[key2][key3];
                                    }
                                }
                            } else if (hasJSON && key3 == "DcDistrict" && lang == "tc") {
                                let data = cmn.SearchDataJson("districts", i[key2][key3])[0];
                                temp.region = data.region;
                                temp.district = data.name;
                                temp.legco = data.legco;
                            } else if (!hasJSON && key3 == "DcDistrict") {
                                if (!("district" in temp)) temp.district = {};
                                temp.district[lang] = i[key2][key3];
                            } else if (key3 == "BlockDescriptorPrecedenceIndicator" && lang == "en") {
                                temp[k].indicator = i[key2][key3] == "Y";
                            } else {
                                let r = new RegExp(k, "i"),
                                    k2 = key3.replace(r, "").toCamelCase();
                                if (m = k2.match(/buildingNo(From|To)/)) k2 = m[1].toLowerCase();
                                if (k == "block") {
                                    if (!(k2 in temp[k])) temp[k][k2] = {};
                                    temp[k][k2][lang] = i[key2][key3];
                                } else {
                                    temp[k][k2] = i[key2][key3];
                                }
                            }
                        }
                    }
                }
            }
        }
        result.push(new Location(temp));
    })
    return result;
}

module.exports = search;