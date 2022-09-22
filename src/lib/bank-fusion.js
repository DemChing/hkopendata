const cmn = require("../common");

function PreprocessFields(data) {
    const FIELDS = {
        regex: {
            "^product": ""
        },
        text: {
            "ccyCode": "currency",
            "description": "remarks",
            "qualification": "eligibility",
            "interestPeriod": "interestFrequency",
            "period": "compoundingFrequency",
            "interestAccrualMethod": "calculationMethod",
            "accrualMode": "calculationMethod",
            "prodId": "id",
            "rateType": "interestRateType",
            "benchDay": "daysInYear",
            "accountFeatures": "featureBenefit",
            "interest": "tierBand",
            "rateList": "tierBandMethod",
        },
        number: {
            "fee": "feesCharge",
            "minBalance": "minBalance",
            "boundAmount": "minAmount",
            "rate": "interestRate",
            "initialamount": "principalAmount",
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
        if (m = key.match(/^min([A-Z][A-z]+)/)) {
            temp[m[1]] = {
                min: data[key],
            }
        } else if (key === 'desc') {
            temp.description = data[key];
        } else if (key === 'age') {
            m = data[key].match(/(\d+)/);
            temp[key] = m ? parseInt(m[1]) : data[key];
        } else {
            temp[key] = ParseItem(data[key]);
        }
    }

    if ('deposit' in temp && 'currency' in temp) {
        temp.deposit.currency = temp.currency;
    }
    if ('eligibility' in temp) {
        let eligibility = [];
        if (temp.eligibility.age) {
            let eAge = {
                type: 'age',
                min: temp.eligibility.age,
                ...temp.eligibility
            };
            delete eAge.age
            eligibility.push(eAge)
        }
        temp.eligibility = eligibility;
    }

    return temp;
}

function ParseSearchFields(params) {
    const SEARCH_CONFIG = {
        rename: {
            currency: "ccyCode",
            id: "productId",
        }
    }

    return cmn.ParseSearchFields(params, SEARCH_CONFIG);
}

module.exports = {
    PreprocessFields,
    ParseItem,
    ParseSearchFields,
}