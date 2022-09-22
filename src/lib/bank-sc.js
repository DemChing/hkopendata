const cmn = require("../common");
const moment = require("../moment");
const Coordinate = require("../_class").Coordinate;

const CURRENCY_REGEX_ALL = /[A-Z]{3}|澳元|加幣|瑞士法郎|歐羅|英鎊|日元|紐西蘭元|美元|人民幣|港元|港幣/g;
const CURRENCY_REGEX = /([A-Z]{3}|澳元|加幣|瑞士法郎|歐羅|英鎊|日元|紐西蘭元|美元|人民幣|港元|港幣)/;

function PreprocessFields(data) {
    const FIELDS = {
        regex: {
            "(card|investment|insurance)-category": "category"
        },
        number: {
            "buy-price": "buyRate",
            "sell-price": "sellRate",
            "service-fee": "serviceCharge",
            "tenor": "loanTenor",
        },
        text: {
            "last-updated": "lastUpdate",
            "product-url": "product-website",
            "product-apply-url": "product-applyForm",
            "ltv": "loanToValueRatio",
        },
        others: {
            "deposit-rates": "creditInterest",
            "types": "type",
            "telephone": "tel",
            "mortgages": "mortgage",
            "savings-accounts": "saving",
            "current-accounts": "current",
            "time-deposit-accounts": "timeDeposit",
            "credit-cards": "creditCard",
            "personal-loans": "loan",
            "investments": "investment",
            "title": "name",
            "summary-title": "name",
            "summary": "remarks",
            "details": "description",
            "url": "website",
        }
    }

    if (Array.isArray(data)) {
        return data.map(v => PreprocessFields(v))
    } else if (typeof data === "object" && data !== null) {
        if (Object.keys(data) == 0) return data;
        let temp = {},
            common = ["product", "category", "tnc", "premium"],
            keyJoin = common.join("|"),
            regex = new RegExp(keyJoin, "i"),
            group = {};
        data = cmn.RenameFields(data, FIELDS);

        Object.keys(data).filter(v => regex.test(v)).map(v => {
            let r = new RegExp(`(${keyJoin})-([A-z-]+)`),
                m = v.match(r);
            if (m) {
                if (/category/.test(m[1])) {
                    delete data[v];
                } else {
                    for (let key in data) {
                        if (key.match(`${m[1]}(.*)`)) {
                            let ckey = m[1].toCamelCase(),
                                citem = key.replace(`${m[1]}-`, "").toCamelCase();
                            if (!(ckey in group)) group[ckey] = {}
                            group[ckey][citem] = data[key];
                            delete data[key];
                        }
                    }
                }
            }
        })
        group = PreprocessFields(group);
        for (let name in group) {
            if (/^(product|tnc)$/.test(name)) {
                for (let key in group[name]) {
                    if (!(key in temp)) {
                        temp[key] = group[name][key];
                        delete group[name][key];
                    }
                }
            } else {
                let r = new RegExp(name);
                Object.keys(data).filter(v => r.test(v)).map(v => {
                    group[name][v.replace(r, "").toCamelCase()] = data[v];
                    delete data[v];
                })
                temp[name] = group[name];
            }
        }
        for (let key in data) {
            let ckey = key.toCamelCase();
            if (Array.isArray(data[key])) {
                temp[ckey] = data[key].map(v => PreprocessFields(v));
            } else if (typeof data[key] === "object") {
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

    let temp = {},
        opening = {
            mon: false,
            tue: false,
            wed: false,
            thu: false,
            fri: false,
            sat: false,
            sun: false,
        },
        hasOpening = false;

    for (let key in data) {
        if (key == "services") {
            temp[key] = {};
            data[key].map(v => {
                let ckey = v.toCamelCase();
                if (ckey == "cashAndChequeDepositMachines") {
                    temp[key].cashDepositMachine = true;
                    temp[key].chequeDepositMachine = true;
                } else {
                    temp[key][ckey] = true;
                }
            });
        } else if (key == "address") {
            temp.address = data[key].addressLines;
            temp.coordinate = new Coordinate({
                latitude: parseFloat(data[key].latitude),
                longitude: parseFloat(data[key].longitude),
            })
        } else if (key == "is24Hours" && data[key]) {
            hasOpening = true;
            for (let k in opening) {
                opening[k] = "00:00-23:59";
            }
        } else if (key == "regularHours") {
            hasOpening = true;
            data[key].map(v => {
                let weekday = Object.keys(opening),
                    od = weekday[v.openDay - 1],
                    ed = weekday[v.closeDay - 1],
                    ot = moment(v.openTime, "HH:mm AA", "en-US").format("HH:mm"),
                    et = moment(v.closeTime, "HH:mm AA", "en-US").format("HH:mm");
                if (!opening[od]) opening[od] = [];

                if (od == ed) {
                    opening[od].push(`${ot}-${et}`);
                } else {
                    if (v.closeDay < v.openDay) v.closeDay += 7;
                    opening[od].push(`${ot}-23:59`);
                    for (let i = v.openDay; i < v.closeDay - 1; i++) {
                        opening[weekday[i % 7]] = ["00:00-23:59"];
                    }
                    opening[ed] = [`00:00-${et}`];
                }
            })
        } else if (key == "lastUpdate") {
            temp[key] = moment(data[key], "YYYYMMDDHHmmss").format("YYYY-MM-DD HH:mm:ss");
        } else if (key == "eligibility") {
            if (!("eligibility" in temp)) temp.eligibility = [];
            data[key].map(v => {
                for (let k in v) {
                    let t = {
                        type: k
                    };
                    if (/age|income/i.test(k)) {
                        if (/income/i.test(k)) {
                            t.type = "income";
                        }
                        let r = processCurrencyAmount(v[k]);
                        for (let k2 in r) {
                            t[k2] = r[k2];
                        }
                    } else {
                        t.remarks = v[k];
                    }
                    temp.eligibility.push(t)
                }
            })
        } else if (/^(annualFee|supplementaryFee|handlingFee)$/.test(key)) {
            if (!("feesCharge" in temp)) temp.feesCharge = [];
            let m, fee = {
                name: key,
            };
            if (typeof data[key] === "number") {
                fee.amount = data[key];
            } else if (m = data[key].match(/([0-9,]+)/)) {
                fee.amount = parseFloat(m[1].replace(/[^0-9]/g, ""));
                if (m = data[key].match(CURRENCY_REGEX)) {
                    fee.currency = m[1];
                }
            } else {
                fee.remarks = data[key];
            }
            temp.feesCharge.push(fee)
        } else if (key == "initialDeposit") {
            if (!("eligibility" in temp)) temp.eligibility = [];
            temp.eligibility.push({
                ...{
                    type: key
                },
                ...processCurrencyAmount(data[key])
            })
        } else if (key == "feeWaiver") {
            if (!("feesCharge" in temp)) temp.feesCharge = [];
            temp.feesCharge.push({
                name: key,
                remarks: data[key]
            })
        } else if (key == "loanAmount") {
            temp[key] = processCurrencyAmount(data[key]);
        } else if (key == "feesAndCharges") {
            if (!("feesCharge" in temp)) temp.feesCharge = [];
            data[key].map(v => {
                let t = {}
                for (let k in v) {
                    if (k == "currency") {
                        t[k] = v[k].match(CURRENCY_REGEX_ALL)
                        if (t[k].length == 1) t[k] = t[k][0];
                    } else if (k == "type") {
                        t.name = v[k];
                    } else if (k == "description") {
                        t.remarks = v[k];
                    } else {
                        t[k] = v[k];
                    }
                }
                if ("name" in t && !("remarks" in t)) {
                    t.remarks = t.name;
                    delete t.name;
                }
                temp.feesCharge.push(t)
            })
        } else if (/^(features|benefits)$/.test(key)) {
            if (!("featureBenefit" in temp)) temp.featureBenefit = [];
            let feature = [];
            data[key].map(v => {
                let t = {}
                for (let k in v) {
                    t[/description|data/.test(k) ? "remarks" : k] = v[k]
                }
                feature.push(t);
            })
            temp.featureBenefit = temp.featureBenefit.concat(feature)
        } else if (key == "currency") {
            if (CURRENCY_REGEX_ALL.test(data[key])) {
                temp[key] = data[key].match(CURRENCY_REGEX_ALL)
            } else {
                temp[key] = data[key].split(/,|、/).map(v => v.trim())
            }
            if (temp[key].length == 1) temp[key] = data[key];
        } else if (key != "id") {
            temp[key] = data[key];
        }
    }

    if (hasOpening) {
        temp.opening = opening;
    }

    if ("cardCategory" in temp) {
        temp.card = {
            type: temp.cardCategory
        }
        delete temp.cardCategory;
        if ("code" in temp) {
            temp.card.code = temp.code;
            delete temp.code;
        }
        if ("subCode" in temp) {
            temp.card.subCode = temp.subCode;
            delete temp.subCode;
        }
    } else if ("code" in temp && "subCode" in temp) {
        if (temp.subCode == temp.code) {
            delete temp.subCode;
        }
    }

    if ("coverageCharges" in temp) {
        temp.coverageCharges.map((v, i) => {
            if ("premium" in v) {
                for (let key in v.premium) {
                    if (/annually|monthly|onetime/.test(key)) {
                        temp.coverageCharges[i].premium[key] = processCurrencyAmount(v.premium[key])
                    }
                }
            }
        })
    }
    return temp;
}



function DataValidate(target, queryData) {
    const CATEGORY = {
        "saving": "SA",
        "current": "CA",
        "timeDeposit": "TD",
        "creditCard": "CC",
        "loan": "PL",
        "mortgage": "ML",
        "investment": "Inv",
        "insurance": "Ins",
    }
    const ACCEPT_LANG = {
        en: "en-HK",
        tc: "zh-HK"
    }
    let data = true;
    if (target == "fx") {
        if (queryData.currency) {
            let currency = queryData.currency.split(",").map(v => {
                return v.length == 3 ? v + "HKD" : v;
            }).filter(v => v.length == 6 && /AUD(CAD|CHF|CNH|HKD|JPY|NZD|SGD|USD)|CAD(CHF|CNH|HKD|JPY|SGD)|CHF(CNH|HKD|JPY|SGD)|CNHHKD|EUR(AUD|CAD|CHF|CNH|GBP|HKD|JPY|NZD|SGD|USD)|GBP(AUD|CAD|CHF|CNH|HKD|JPY|NZD|SGD|USD)|JPY(CNH|HKD)|NZD(CAD|CHF|CNH|HKD|JPY|SGD|USD)|SGD(CNH|HKD|JPY)|USD(CAD|CHF|CNH|HKD|JPY|SGD)/.test(v)).join(",");
            if (currency.length == 0) data = false;
            else data = {
                currency
            }
        } else {
            data = false;
        }
    } else if (/atm|branch/.test(target)) {
        data = {
            type: target
        }
    } else if (target in CATEGORY) {
        if (!(queryData.lang in ACCEPT_LANG)) queryData.lang = "en";
        data = {
            category: CATEGORY[target],
            language: ACCEPT_LANG[queryData.lang],
        }
    }
    return data
}

function processCurrencyAmount(data) {
    if (typeof data === "number") return data;
    else if (typeof data === "string") {
        let m = data.match(/([0-9,.-]+)/),
            n = data.match(CURRENCY_REGEX),
            result = {};
        if (m) {
            result.amount = parseFloat(m[1].replace(/[^0-9.-]/g, ""));
        }
        if (n) {
            result.currency = n[1];
        }
        if (!m && !n) return data;
        return result
    } else if (Array.isArray(data)) {
        return data.map(v => processCurrencyAmount(v));
    } else if (typeof data === "object" && data !== null) {
        let temp = {};
        for (let key in data) {
            if (/^(amount|min|max)$/.test(key)) {
                let r = processCurrencyAmount(data[key]);
                if ("amount" in r) temp[key] = r.amount;
                if ("currency" in r) temp.currency = r.currency;
            } else {
                temp[key] = data[key];
            }
        }
        return temp;
    }
    return data;
}

module.exports = {
    PreprocessFields,
    ParseItem,
    DataValidate,
}