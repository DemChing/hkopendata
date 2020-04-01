// https://www.hongkongpost.hk/opendata/DataDictionary/tc/DataDictionary_PostageRate.pdf

const cmn = require("../../common");
const UnitValue = require("../../_class").UnitValue;
const BASE_URL = "https://www.hongkongpost.hk/opendata/postageRate-{type}.json";

const VALID = {
    type: /^local-(ORD|REG|PAR|LCP|SMP|bulk-(LBM|LPS))|intl-(ORD|REG|SURPAR|AIRPAR|SPT|EXP|bulk-(IML|LWA|BAM|OPS))|businessSolution$/,
};
const PARAMS = {
    type: "local-ORD"
}
const RENAME = {
    regex: {
        "destinationName": "destination"
    },
    number: {
        "wgtLimit": "weightLimit",
        "amount": "charge",
        "handleFee": "serviceCharge",
    }
}

function validateParameters(params) {
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
                    resolve(processData(res, opts))
                })
                .catch((err) => reject(err))
        }
    })
}

function processData(data, opts) {
    let result = [];
    data.data.map(item => {
        let temp = preprocessFields(item);
        temp.lastUpdate = data.lastUpdateDate;
        result.push(temp);
    })
    return result;
}

function preprocessFields(data) {
    const WEIGHT_UNIT = {
        type: "weight",
        category: "gram",
        scale: "kilo",
    };
    if (Array.isArray(data)) return data.map(v => preprocessFields(v))
    else if (typeof data === "object" && data !== null) {
        data = cmn.RenameFields(data, RENAME);
        let temp = {};
        for (let key in data) {
            let m;
            if (typeof data[key] === "object" && data[key] != null) {
                temp[key] = preprocessFields(data[key])
            } else if (m = key.match(/^([A-z]+)(TC|SC|EN)$/)) {
                if (!(m[1] in temp)) temp[m[1]] = {};
                temp[m[1]][m[2].toLowerCase()] = data[key];
            } else if (m = key.match(/additional(Amount|Weight)/)) {
                if (!("overweight" in temp)) temp.overweight = {};
                if (m[1] == "Amount") {
                    temp.overweight.charge = parseFloat(data[key]);
                } else {
                    temp.overweight.weight = new UnitValue({
                        ...WEIGHT_UNIT,
                        ...{
                            value: data[key]
                        }
                    });
                }
            } else if (/weight(To|From)/.test(key)) {
                if (!("weightLimit" in temp)) temp.weightLimit = {};
                let limit = key == "weightTo" ? "max" : "min";
                temp.weightLimit[limit] = new UnitValue({
                    ...WEIGHT_UNIT,
                    ...{
                        value: data[key]
                    }
                });
                temp.weightLimit[limit].toBestScaleSI();
            } else if (key == "weightLimit") {
                temp[key] = new UnitValue({
                    ...WEIGHT_UNIT,
                    ...{
                        value: data[key]
                    }
                });
            } else if (/Code$/.test(key) || key == "trackingLevel") {
                if (key == "trackingLevel") {
                    temp.tracking = data[key] != "0";
                }
                temp[`_${key}`] = data[key];
            } else {
                temp[key] = data[key];
            }
        }
        if ("subServiceName" in temp) {
            temp.mlss = temp.subServiceName.tc.indexOf("非標準") == -1;
        }
        return temp;
    }
    return data;
}

module.exports = search