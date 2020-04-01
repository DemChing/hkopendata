const cmn = require("../common");
const moment = require("../moment");
const Coordinate = require("../_class").Coordinate;

function PreprocessFields(data) {
    const FIELDS = {
        regex: {
            "^(fund|structured|stock|preciousMetal)Products$": "investment",
            "^([A-z]+)Products$": "$1",
            "^withCnyWithDrawal$$f-i": "rmbWithdrawal",
            "^withFcyWithDrawal$$f-i": "foreignCurrency",
            "^atmProviderNetwork$$f-i": "atmNetwork",
            "^withCdm$$f-i": "cashDepositMachine",
            "^withChq$$f-i": "chequeDepositMachine",
            "^withAtm$$f-i": "automatedTellerMachine",
            "^withCnyAtm$$f-i": "aTMwithRMB",
            "^withFcyAtm$$f-i": "aTMwithFC",
        },
        text: {
            "phoneNo": "tel",
            "faxNo": "fax",
            "remark": "remarks",
            "lastUpdateDate": "lastUpdate",
            "lastUpdateDatetime": "lastUpdate",
            "hkDistrict": "district",
            "withCashDesposit": "cashDepositMachine",
            "withChequeDesposit": "chequeDepositMachine",
            "withFcyNotesWithdrawal": "foreignCurrencyAvailable",
            "withDepositBox": "safeDepositBox",
            "withSecurities": "securitiesServices",
            "productPageLink": "website",
            "productApplicationLink": "applyForm",
            "tncLink": "termsAndConditions",
            "docLink": "file",
            "prerequisite": "remarks",
            "effectiveDate": "startDate",
            "expiryDate": "endDate",
            "remark": "remarks",
            "withATMCard": "aTMCard",
            "withPassbook": "passbook",
            "withIbanking": "ebanking",
            "withPhonebanking": "phoneBanking",
            "withMobilebanking": "mobileBanking",
            "withFPS": "fps",
            "withJetcoPay": "jetcoPay",
            "withCHATS": "cHATS",
            "withRTGS": "rTGS",
            "withTT": "tT",
            "rate": "interestRate",
            "depositTerm": "tierValueTerm",
            "depositFreq": "interestFrequency",
            "compoundingFreq": "compoundingFrequency",
            "cardCompany": "cardScheme",
        },
        others: {
            "atms": "atm",
            "branches": "branch",
            "boxDetails": "depositBox",
            "currencyCode": "currency",
            "ttRateInfo": "teleTransfer",
            "noteRateInfo": "noteExchange",
            "bidRate": "buyRate",
            "offerRate": "sellRate",
            "minLoanAmount": "tierValueMinimum",
            "maxLoanAmount": "tierValueMaximum",
            "tenorUnit": "termPeriod",
            "tenor": "tierValueTerm",
            "repayFreq": "repaymentFrequency",
            "feature": "features",
            "bankService": "bankServices",
        }
    }
    if (Array.isArray(data)) {
        return data.map(v => PreprocessFields(v))
    } else if (typeof data === "object" && data !== null) {
        let temp = {};
        data = cmn.RenameFields(data, FIELDS);
        for (let key in data) {
            temp[key] = PreprocessFields(data[key]);
        }
        return temp;
    }
    return data;
}

function parseOthers(data) {
    if (Array.isArray(data)) return data.map(v => parseOthers(v));
    else if (typeof data === "object" && data !== null) {
        let temp = {};
        if ("key" in data && "value" in data) {
            temp[data.key] = data.value;
        } else {
            for (let key in data) {
                temp[key] = data[key];
            }
        }
        return temp;
    }
    return data;
}

function ParseItem(data, type) {
    if (Array.isArray(data)) return data.map(v => ParseItem(v));
    else if (typeof data === "object" && data !== null) {
        let temp = {};
        for (let key in data) {
            if (data[key] === null) {} else if (/^(latitude|longitude)$/.test(key)) {
                if (!("coordinate" in temp)) temp.coordinate = {};
                temp.coordinate[key] = data[key];
            } else if (key == "others") {
                temp.others = parseOthers(data[key]);
            } else if (key == "district") {
                temp[key] = data[key].split(/(?=[A-Z])/).map(v => v == "N" ? "&" : v).join(" ")
            } else if (key == "markets") {
                temp.stockMarket = data[key].map(v => v.toLowerCase());
            } else if (key == "suppInfo") {
                for (let k in data[key]) {
                    if (/^(remarks|others)$/.test(k)) {
                        if (!("suppInfo" in temp)) temp.suppInfo = {};
                        temp.suppInfo[k] = data[key][k];
                    } else {
                        temp[k] = data[key][k];
                    }
                }
            } else if (key == "lastUpdate") {
                if (data[key] != "") {
                    temp[key] = moment(data[key]).format("YYYY-MM-DD")
                }
            } else if (key == "openingHours") {
                temp.opening = cmn.StrToWeekTime(data[key]);
            } else if (key == "eligibility") {
                let eligibility = {};
                for (let k in data[key]) {
                    let m;
                    if (m = k.match(/^(min|max)([A-z]+)$/)) {
                        let k2 = m[2].toCamelCase();
                        if (!(k2 in eligibility)) eligibility[k2] = {};
                        eligibility[k2][m[1]] = data[key][k];
                    } else {
                        eligibility[k] = data[key][k];
                    }
                }
                for (let k in eligibility) {
                    let t = {
                            type: k
                        },
                        valid = false;
                    if (Array.isArray(eligibility[k])) {
                        if (eligibility[k].length > 0) {
                            eligibility[k].map(v => {
                                if ("key" in v && "value" in v) {
                                    t[v.key] = v.value;
                                } else {
                                    if (!"remarks" in t) t.remarks = [];
                                    t.remarks.push(v)
                                }
                            })
                            valid = true;
                        }
                    } else if (typeof eligibility[k] === "object" && eligibility[k] !== null) {
                        if (Object.keys(eligibility[k]).length > 0) {
                            for (let k2 in eligibility[k]) {
                                t[k2] = eligibility[k][k2]
                            }
                            valid = true;
                        }
                    } else if (typeof eligibility[k] === "string") {
                        if (eligibility[k] != "") {
                            if (/\d+/.test(eligibility[k])) {
                                t.min = parseInt(eligibility[k].match(/([0-9]+)/)[1]);
                            } else {
                                t = {};
                                t[k] = eligibility[k];
                            }
                            valid = true;
                        }
                    }

                    if (valid) {
                        if (!("eligibility" in temp)) temp.eligibility = [];
                        temp.eligibility.push(t);
                    }
                }
            } else if (key == "accessibilities") {
                if (!("services" in temp)) temp[key] = {};
                if (data[key].length > 0) temp[key].disabledAccess = true;
            } else if (key == "rateInfo") {
                temp.creditInterest = [];
                data[key].map(v => {
                    let t = {
                        interestFrequency: data.interestFrequency
                    }
                    temp.creditInterest.push({
                        ...t,
                        ...v
                    })
                })
            } else if (key == "loanPurpose") {
                const loanPurpose = {
                    "mortgage": ["New Purpose", "Transfer Mortgage", "Transfer Mortgage with Top Up Loan", "Refinancing"]
                }
                temp[key] = loanPurpose[type][data[key] - 1];
            } else if (/^serviceFees$/.test(key)) {
                if (data[key].length > 0)
                    if (!("feesCharge" in temp)) temp.feesCharge = [];
                data[key].map(v => {
                    temp.feesCharge.push({
                        name: v.chargeName,
                        amount: v.chargeAmount,
                        remarks: v.chargeReq
                    })
                })
            } else if (/^rentalFee$/.test(key)) {
                if (data[key] != "") {
                    if (!("feesCharge" in temp)) temp.feesCharge = [];
                    temp.feesCharge.push({
                        name: key,
                        amount: data[key]
                    })
                }
            } else if (/(coverage|payment)Duration/i.test(key)) {
                let m, type;
                if (m = key.match(/(coverage|payment)/i)) {
                    type = m[1].toCamelCase();
                    if (!("termPeriodRange" in temp)) temp.termPeriodRange = {};
                    if (!(type in temp.termPeriodRange)) temp.termPeriodRange[type] = {};
                    if (/Unit/.test(key)) temp.termPeriodRange[type].termPeriod = data[key];
                    else if (m = key.match(/^(min|max|)(coverage|payment)Duration$/i)) temp.termPeriodRange[type][`tierValue-${m[1]}Term`.toCamelCase()] = data[key];
                    else temp.termPeriodRange[type][key.replace(/(coverage|payment)Duration/i, "").toCamelCase()] = data[key];
                }

            } else if (/repay/i.test(key)) {
                if (!("repayment" in temp)) temp.repayment = {};
                temp.repayment[/amount/i.test(key) ? key.replace(/repay/i, "") : key] = data[key];
            } else if (/^card([A-z]+)$/.test(key)) {
                if (!("card" in temp)) temp.card = {};
                temp.card[key.replace("card", "").toCamelCase()] = data[key];
            } else if (/^(services|bankServices)$/.test(key)) {
                if (!(key in temp)) temp[key] = {};
                let services = data[key],
                    others = {};
                if (Array.isArray(services)) services = services[0]
                for (let k in services) {
                    if (k == "others") {
                        services[k].map(v => {
                            if (/^(ture|false)$/i.test(v.value)) {
                                temp[key][v.key] = /^ture$/i.test(v.value)
                            } else {
                                others[v.key] = v.value
                            }
                        })
                    } else if (/(statement|cheque)Type/.test(k)) {
                        let type = k.match(/(statement|cheque)/)[1];
                        temp[key][`${type}Paper`] = false;
                        temp[key][`${type}Electronic`] = false;
                        if (/both|paper/.test(services[k])) {
                            temp[key][`${type}Paper`] = true;
                        }
                        if (/both|electronic/.test(services[k])) {
                            temp[key][`${type}Electronic`] = true;
                        }
                    } else if (typeof services[k] === "boolean") {
                        temp[key][k] = services[k] == true;
                    } else {
                        temp[key][k] = services[k];
                    }
                }
                if (Object.keys(others).length > 0) {
                    temp[key].others = others;
                }
            } else if (/^(features|welcomeOffers|promotions|loyaltyPrograms|fundFeature)$/.test(key)) {
                if (!("featureBenefit" in temp)) temp.featureBenefit = [];
                if (!Array.isArray(data[key])) data[key] = [data[key]];
                data[key].map(v => {
                    let t = {};
                    for (let k in v) {
                        t[k] = v[k] && /Date/.test(k) ? moment(v[k]).format("YYYY-MM-DD") : v[k];
                    }
                    temp.featureBenefit.push(t)
                })
            } else if (/^(termPeriod|tierValueTerm|tierValueMinimum|tierValueMaximum)$/.test(key)) {
                if (!("loanAmount" in temp)) temp.loanAmount = {};
                temp.loanAmount[key] = data[key];
            } else if (/^(teleTransfer|noteExchange)$/.test(key)) {
                temp[key] = {};
                for (let k in data[key]) {
                    temp[key][k] = data[key][k] && k == "lastUpdate" ? moment(data[key][k]).format("YYYY-MM-DD HH:mm:ss") : data[key][k];
                }
                if ("unit" in temp[key]) {
                    if (temp[key].unit) {
                        if (temp[key].buyRate) temp[key].buyRate /= temp[key].unit;
                        if (temp[key].sellRate) temp[key].sellRate /= temp[key].unit;
                    }
                    delete temp[key].unit;
                }
            } else if (!/^(productId|city|countryCode|productType|interestFrequency)$/.test(key)) {
                temp[key] = data[key];
            }
        }
        if ("coordinate" in temp) {
            temp.coordinate = new Coordinate(temp.coordinate);
        }
        return temp;
    }
    return data;
}

module.exports = {
    PreprocessFields,
    ParseItem
}