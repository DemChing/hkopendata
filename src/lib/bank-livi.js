const cmn = require("../common");
const moment = require("../moment");

function PreprocessFields(data) {
    const FIELDS = {
        text: {
            "prod_name": "name",
            "ccy_code": "currency",
            "pay_inst_cyc": "interestFrequency",
            "prodId": "id",
            "effect_date": "startDate",
            "inst_rate": "interestRate",
        },
        number: {
            "servicefee": "serviceCharge",
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
        if (key === 'minRemainBal') {
            temp.balance = {
                min: data[key],
            }
        } else if (key === 'amountAbove') {
            temp.deposit = {
                min: data[key],
            };
        } else if (key == 'startDate') {
            temp[key] = moment(data[key], "YYYYMMDD").format("YYYY-MM-DD HH:mm:ss");
        } else {
            temp[key] = data[key];
        }
    }

    if ('deposit' in temp && 'currency' in temp) {
        temp.deposit.currency = temp.currency;
    }

    return temp;
}

module.exports = {
    PreprocessFields,
    ParseItem,
}