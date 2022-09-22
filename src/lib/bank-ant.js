const cmn = require("../common");

function PreprocessFields(data) {
    const FIELDS = {
        number: {
            "interestRate": "interestRate"
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
        if (m = key.toLowerCase().match(/^amtTier(Top|Bottom)(Included)?/i)) {
            let k = m[1] === 'top' ? 'max' : 'min';
            if (!('deposit' in temp)) temp.deposit = {};
            if (!(k in temp.deposit)) temp.deposit[k] = {};
            if (m[2]) temp.deposit[k].included = Boolean(data[key]);
            else temp.deposit[k].amount = parseFloat(data[key]);
        } else {
            temp[key] = data[key];
        }
    }

    if ('deposit' in temp) {
        for (let key in temp.deposit) {
            temp.deposit[key] = temp.deposit[key].amount + (temp.deposit[key].included ? 0 : key === 'min' ? 1 : -1);
        }
    }

    return temp;
}

module.exports = {
    PreprocessFields,
    ParseItem,
}