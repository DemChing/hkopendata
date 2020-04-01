const cmn = require("../common");
const moment = require("../moment");
const Coordinate = require("../_class").Coordinate;

function PreprocessFields(data) {
    const FIELDS = {
        regex: {
            "([A-z]+)?AmountCurrencyCode": "$1CurrencyCode"
        },
        text: {
            "URL": "website",
            "CurrencyCode": "currency",
            "BaseCurrencyName": "baseName",
            "BaseCurrencyCode": "baseCurrency",
            "CurrencyName": "name",
            "OpenDayDescription": "openDay",
            "ExchangeRateTypeName": "exchangeRateType",
            "CalculationFrequency": "calculateFrequency",
            "Identification": "type",
            "APR": "repAPR",
            "MinCreditLimit": "creditLimitMin",
            "MaxPurchaseInterestFreeLengthDays": "maxInterestFreeDay",
        },
        number: {
            "MinimumAge": "min",
            "LatitudeDescription": "latitude",
            "LongitudeDescription": "longitude",
        },
        others: {
            "Notes": "remarks",
            "LoanInterestTierBand": "tierBand",
        }
    }
    if (Array.isArray(data)) {
        return data.map(v => PreprocessFields(v))
    } else if (typeof data === "object" && data !== null) {
        let temp = {},
            common = {
                "Name": "name",
                "Amount": "amount",
                "CurrencyCode": "currency",
            },
            keyJoin = Object.keys(common).join("|"),
            regex = new RegExp(keyJoin, "i"),
            group = {};
        data = cmn.RenameFields(data, FIELDS);

        Object.keys(data).filter(v => regex.test(v) && !/PerAmount/.test(v)).map(v => {
            let r = new RegExp(`([A-z]+)?(${keyJoin})$`),
                m = v.match(r),
                n;
            if (m) {
                if (m[1]) {
                    if (/Territory|District/.test(m[1])) {
                        temp[m[1].toCamelCase()] = data[v];
                        delete data[v];
                    } else {
                        for (let key in data) {
                            if (n = key.match(`${m[1]}(.*)`)) {
                                let ckey = m[1].toCamelCase(),
                                    citem = n[1] in common ? common[n[1]] : n[1].toCamelCase();
                                if (!(ckey in group)) group[ckey] = {}
                                group[ckey][citem] = n[1] == "Amount" && /^[0-9-.]+$/.test(data[key]) ? parseFloat(data[key]) : data[key];
                                delete data[key];
                            }
                        }
                    }
                } else if (m[2]) {
                    temp[common[m[2]]] = m[2] == "Amount" && /^[0-9-.]+$/.test(data[v]) ? parseFloat(data[v]) : data[v];
                    delete data[v];
                }
            }
        })

        for (let name in group) {
            if (/^(brand|atm|branch|loanCap|fee|repayment|minimumRepayment)$/.test(name)) {
                if (Object.keys(temp) == 0 || Object.keys(group[name]).filter(v => v in temp).length == 0) {
                    for (let k in group[name]) {
                        if (/minimumRepayment/.test(name) && k == "amount") temp.minRepay = group[name][k];
                        else temp[k.toCamelCase()] = group[name][k];
                    }
                } else {
                    temp[name] = group[name];
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
        for (let key in temp) {
            temp[key] = PreprocessFields(temp[key])
        }
        for (let key in data) {
            let k = key.toCamelCase();
            if (typeof data[key] === "object") {
                if ("TierBand" in data[key]) {
                    temp[k] = PreprocessFields(data[key].TierBand);
                } else {
                    temp[k] = PreprocessFields(data[key]);
                }
            } else if (typeof data[key] === "string") {
                temp[k] = data[key].trim();
                if (temp[k] == "") delete temp[k];
            } else {
                temp[k] = data[key];
            }
        }
        return temp
    }
    return data;
}

function ParseEligibility(data) {
    let eligibility = [];
    Object.keys(data).map(e => {
        let type = e.match(/^([a-z]+)Eligibility/)[1].toCamelCase();
        if (Array.isArray(data[e])) {
            parseEligibility(data[e], type).map(v => eligibility.push(v));
        } else {
            eligibility.push(parseEligibility(data[e], type));
        }
    })
    return eligibility;
}

function parseEligibility(data, type) {
    if (Array.isArray(data)) {
        return data.map(v => parseEligibility(v, type))
    } else if (typeof data === "object" && data !== null) {
        let temp = {
            type: type,
        }
        return {
            ...temp,
            ...data
        }
    }
    return data;
}

function ParseItem(data) {
    if (typeof data !== "object" || data === null) return data;
    else if (Array.isArray(data)) return data.map(v => ParseItem(v));
    const FIELDS = {
        "name": "name",
        "websiteAddress": "website",
        "hotlineNumber": "tel",
        "currency": "currency",
    };
    let temp = {};
    for (let key in FIELDS) {
        if (key in data) {
            temp[FIELDS[key]] = data[key];
            delete data[key];
        }
    }
    for (let key in data) {
        if (key == "address") {
            if ("territory" in data[key]) temp.region = data[key].territory;
            if ("district" in data[key]) temp.district = data[key].district;
            if ("addressLine" in data[key]) temp.address = data[key].addressLine;
            if ("latitude" in data[key] && "longitude" in data[key]) {
                temp.coordinate = new Coordinate({
                    latitude: parseFloat(data[key].latitude),
                    longitude: parseFloat(data[key].longitude),
                });
            }
            delete data[key];
        } else if (key == "services") {
            temp.services = {};
            for (let k in data[key]) {
                let m;
                if (m = k.match(/([A-z]+)((Operat|Open)ingHour|CutOffTime)/)) {
                    if (!("operatingHour" in temp.services)) temp.services.operatingHour = {}
                    temp.services.operatingHour[m[1].toCamelCase()] = data[key][k];
                } else if (data[key][k]) {
                    let rename = {
                            "rMBandForeignCurrencyATM": "foreignCurrencyAvailable",
                            "rMBATMwithoutForeignCurrency": "aTMwithRMB",
                        },
                        k2 = k.replace("Indicator", "").toCamelCase();
                    temp.services[k2 in rename ? rename[k2] : k2] = data[key][k];
                }
            }
            delete data[key];
        } else if (key == "openingHours") {
            temp.opening = {};
            data[key].map(v => {
                let str = "-";
                if (v.openTime && v.closeTime) {
                    str = `${moment(v.openTime, "HH:mm").format("HH:mm")}-${moment(v.closeTime, "HH:mm").format("HH:mm")}`
                } else if (v.openTime || v.closeTime) {
                    str = v.openTime ? moment(v.openTime, "HH:mm").format("HH:mm") : moment(v.closeTime, "HH:mm").format("HH:mm")
                }
                temp.opening[v.openDay.toLowerCase().substr(0, 3)] = [str];
            })
            for (let k in temp.opening) {
                let filter = temp.opening[k].filter(v => v != "-");
                temp.opening[k] = filter.length > 0 ? filter : false;
            }
            delete data[key];
        } else if (key == "contactInformation") {
            if ("phoneNumber" in data[key]) {
                temp.tel = data[key].phoneNumber;
            }
            if ("faxNumber" in data[key]) {
                temp.fax = data[key].faxNumber;
            }
            delete data[key];
        }
    }
    if ("coreProduct" in data) {
        let rename = {
            "productDescription": "description",
            "productURL": "website",
            "tcsAndCsURL": "termsAndConditions",
            "applicationFormURL": "applyForm",
            "applicationHotline": "telApply",
            "customerServiceHotline": "telCs",
            "hotlineNumber": "tel",
            "cardScheme": "scheme"
        }
        for (let k in data.coreProduct) {
            if (/AccessChannels/.test(k)) {
                if (!("accessChannel" in temp)) temp.accessChannel = [];
                temp.accessChannel = temp.accessChannel.concat(data.coreProduct[k]);
            } else if (/^(cardScheme|creditLimit|maxInterestFreeDay)$/.test(k)) {
                if (!("card" in temp)) temp.card = {}
                temp.card[k in rename ? rename[k] : k] = data.coreProduct[k];
            } else if (k in rename) {
                temp[rename[k]] = data.coreProduct[k];
            } else {
                temp[k] = data.coreProduct[k];
            }
        }

        if ("accessChannel" in temp) {
            temp.accessChannel = temp.accessChannel.map(v => v.trim());
        }

        delete data.coreProduct;
    }
    if ("repayment" in data) {
        temp.repayment = data.repayment.map(v => ParseItem(v));
        delete data.repayment;
    }
    if ("eligibility" in data) {
        temp.eligibility = ParseEligibility(data.eligibility);
        delete data.eligibility;
    }
    if ("featuresAndBenefits" in data) {
        temp.featureBenefit = data.featuresAndBenefits.featureBenefitItem.map(v => ParseItem(v));
        delete data.featuresAndBenefits;
    }
    if ("feesCharges" in data) {
        temp.feesCharge = data.feesCharges.feeChargeDetail.map(v => {
            let fee = ParseItem(v);
            if ("fee" in fee && Object.keys(fee.fee).filter(v => v in fee).length == 0) {
                for (let key in fee.fee) {
                    fee[key] = fee.fee[key];
                }
                delete fee.fee;
            }
            return fee;
        });
        delete data.feesCharges;
    }
    if ("loanCap" in data) {
        temp.loanAmount = data.loanCap.map(v => {
            let t = ParseItem(v);
            if ("amount" in t) {
                t.max = t.amount;
                delete t.amount
            }
            return t;
        })
        delete data.loanCap;
    }
    if ("bankBuyRate" in data) {
        temp.buyRate = parseFloat(data.bankBuyRate);
        delete data.bankBuyRate;
    }
    if ("bankSellRate" in data) {
        temp.sellRate = parseFloat(data.bankSellRate);
        delete data.bankSellRate;
    }
    if ("fixedVariableInterestRateType" in data) {
        temp.fixedInterestRate = data.fixedVariableInterestRateType == "Fixed";
        delete data.fixedVariableInterestRateType;
    }
    if ("remarks" in data) {
        temp.remarks = data.remarks;
        delete data.remarks;
    }
    if ("lastUpdateDateTime" in data) {
        temp.lastUpdate = moment(data.lastUpdateDateTime).format("YYYY-MM-DD HH:mm:ss");
        delete data.lastUpdateDateTime;
    }
    for (let key in data) {
        if (/CurrencyCode/.test(key)) {
            if ("currency" in data) {
                temp[key.replace("Code", "")] = data[key];
            } else {
                temp.currency = data[key];
            }
        } else {
            temp[key] = ParseItem(data[key]);
        }
    }
    return temp;
}

module.exports = {
    ParseEligibility,
    PreprocessFields,
    ParseItem
}