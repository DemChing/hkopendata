const cmn = require("../common");

function PreprocessFields(data) {
    const FIELDS = {
        text: {
            "interestCalculationMethodology": "calculationMethod",
            "feeAndCharges": "feesCharge",
            "productURL": "url",
            "applicationURL": "applyMethod",
            "availabilityServices": "services"
        },
        number: {
            "minAgeRequirement": "eligibilityAge",
            "minBalanceRequirement": "eligibilityInitialBalance",
        }
    }
    if (Array.isArray(data)) {
        return data.map(v => PreprocessFields(v))
    } else if (typeof data === "object" && data !== null) {
        if (Object.keys(data) == 0) return data;
        let temp = {};
        data = cmn.RenameFields(data, FIELDS);

        for (let key in data) {
            let ckey = key.toCamelCase();
            if (Array.isArray(data[key])) {
                temp[ckey] = data[key].map(v => PreprocessFields(v));
            } else if (typeof data[key] === "object" || typeof data[key] === "string") {
                temp[ckey] = PreprocessFields(data[key]);
            } else {
                temp[ckey] = data[key]
            }
        }
        return temp;
    }
    return data;
}

function ParseItem(data) {
    if (typeof data !== "object" || data === null) return data;
    else if (Array.isArray(data)) return data.map(v => ParseItem(v));

    let temp = {};
    for (let key in data) {
        let m;
        if (m = key.match(/^eligibility([A-z]+)/)) {
            if (!("eligibility" in temp)) temp.eligibility = {};
            temp.eligibility[m[1].toCamelCase()] = data[key];
        } else {
            temp[key] = data[key];
        }
    }

    return temp;
}

module.exports = {
    PreprocessFields,
    ParseItem,
}