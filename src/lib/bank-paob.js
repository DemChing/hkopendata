const cmn = require("../common");

function PreprocessFields(data) {
    const FIELDS = {
        text: {
            "payoutFreq": "interestFrequency",
            "rateType": "interestRateType",
            "withFPS": "withFps",
        },
        number: {
            "rate": "interestRate",
            "eligibilityAge": "eligibilityAge",
            "eligibilityInitialBalance": "eligibilityInitialBalance",
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
        if (m = key.match(/^charge([A-z]+)/)) {
            if (!("feesCharge" in temp)) temp.feesCharge = {};
            temp.feesCharge[m[1].toCamelCase()] = data[key];
        } else if (m = key.match(/^eligibility([A-z]+)/)) {
            if (!("eligibility" in temp)) temp.eligibility = {};
            temp.eligibility[m[1].toCamelCase()] = data[key];
        } else if (m = key.match(/^prod([A-z]+)/)) {
            temp[m[1].toCamelCase()] = data[key];
        } else if (m = key.match(/^with([A-z]+)/)) {
            temp[m[1].toCamelCase()] = data[key] === 'Y';
        } else if (m = key.match(/^features([A-z]+)(\d+)$/)) {
            if (!("featureBenefit" in temp)) temp.featureBenefit = {};
            if (!(m[2] in temp.featureBenefit)) temp.featureBenefit[m[2]] = {};
            temp.featureBenefit[m[2]][m[1].toCamelCase()] = data[key];
        } else if (m = key.match(/^supportingDocument(\d+)$/) && data[key].trim()) {
            if (!("documents" in temp)) temp.documents = [];
            temp.documents.push(data[key]);
        } else if (key == "statementType") {
            if (/both/i.test(data[key])) {
                temp.statementPaper = true;
                temp.statementElectronic = true;
            } else {
                if (/print|紙|纸/i.test(data[key])) {
                    temp.statementPaper = true;
                }
                if (/electronic|電子|电子/i.test(data[key])) {
                    temp.statementElectronic = true;
                }
            }
        } else {
            temp[key] = data[key];
        }
    }

    if ("featureBenefit" in temp) {
        temp.featureBenefit = Object.values(temp.featureBenefit)
            .filter(({ name, description }) => name.trim() || description.trim());
    }

    return temp;
}

module.exports = {
    PreprocessFields,
    ParseItem,
}