const cmn = require("../common");
const moment = require("../moment");
const Coordinate = require("../_class").Coordinate;

function PreprocessFields(data) {
    const FIELDS = {
        text: {
            "district": "location",
            "phoneNumber": "tel",
            "faxNumber": "fax",
            "branchName": "name",
            "ATM Name": "name",
            "productName": "name",
            "location": "coordinate",
            "addressLine1": "address",
            "branchPhotoURL": "img",
            "servicesOffered": "services",
            "ATMNetwork": "atmNetwork",
            "calculationFrequency": "calculateFrequency",
            "creditingFrequency": "interestFrequency",
            "productURL": "website",
            "URL": "website",
            "currencies": "currency",
            "interestRates": "interestRate",
            "notes": "remarks",
            "applicationURL": "applyMethod",
            "partySegment": "customerType",
            "boardRateType": "type"
        },
        others: {
            "promotionDetl": "featureBenefit",
            "feeChargeDetl": "feesCharge",
            "rewardsDetl": "spendingRewards",
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
    } else if (typeof data === "string") {
        return data.breakline();
    }
    return data;
}

function ParseItem(data) {
    if (typeof data !== "object" || data === null) return data;
    else if (Array.isArray(data)) return data.map(v => ParseItem(v));
    let temp = {};
    for (let key in data) {
        let m;
        if (key == "contactDetl") {
            for (let k in data[key]) {
                if (k == "address") {
                    for (let k2 in data[key][k]) {
                        temp[k2] = data[key][k][k2];
                    }
                } else if (k == "phone") {
                    temp.tel = data[key][k].map(v => v.tel ? v.tel : "");
                } else {
                    temp[k] = data[key][k];
                }
            }
        } else if (key == "exchangeRates") {
            for (let k in data[key]) {
                if (k == "lastUpdate") {
                    temp[k] = moment(data[key][k]).format("YYYY-MM-DD HH:mm:ss");
                } else {
                    temp[k] = data[key][k];
                }
            }
        } else if (key == "eligibilityCriteria") {
            temp.eligibility = {};
            if ("minimumAge" in data[key]) {
                temp.eligibility.age = {
                    min: data[key].minimumAge.parseNumber()
                }
            }
            if ("criteriaAmountType" in data[key] && "amount" in data[key]) {
                let type = "initialBalance"
                if (data[key].criteriaAmountType == "Minimum Annual Income") {
                    type = "annualIncome"
                } else if (data[key].criteriaAmountType == "Initial Minimum Balance Amount") {
                    type = "initialBalance"
                }

                temp.eligibility[type] = {
                    min: data[key].amount.amount,
                    currency: data[key].amount.currency
                }
            }
            if ("additionalCriteria" in data[key]) {
                temp.eligibility.others = data[key].additionalCriteria;
            }
        } else if (key == "interestRatesDetl") {
            temp.creditInterest = data[key].interestRate.map(v => {
                let t = {};
                for (let k in v) {
                    if (k == "minimumDepositAmount") {
                        if (!("deposit" in t)) t.deposit = {};
                        t.deposit.min = v[k].amount;
                        t.deposit.currency = v[k].currency;
                    } else if (k == "depositPeriod") {
                        if (!("deposit" in t)) t.deposit = {};
                        t.deposit.period = v[k];
                    } else if (k == "rate") {
                        t.interestRate = v[k].parseNumber()
                    } else if (m = k.match(/promotionCode([A-z]+)?/)) {
                        let ckey = m[1] ? m[1].toCamelCase() : "code";
                        if (!("promotion" in t)) t.promotion = {};
                        t.promotion[ckey] = v[k];
                    } else {
                        t[k == "rateType" ? "name" : k] = v[k];
                    }
                }
                for (let k in data[key].interestCalculation) {
                    t[k] = data[key].interestCalculation[k]
                }
                return t;
            })
        } else if (key == "loanPricingDetl") {
            if (!("loanInterest" in temp)) temp.loanInterest = {
                loanInterestTierBandSet: [{
                    tierBand: [{}]
                }]
            };
            for (let k in data[key]) {
                if (m = k.match(/m(ax|in)imumLoanAmount/)) {
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0][`tierValueM${m[1]}imum`] = data[key][k].amount;
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].currency = data[key][k].currency
                } else if (m = k.match(/m(ax|in)imumLoanTenure/)) {
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0][`tierValueM${m[1]}Term`] = data[key][k];
                } else if (k == "interestRateDetl") {
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].interestRate = data[key][k].map(v => {
                        return v
                    })
                } else {
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0][k] = data[key][k];
                }
            }
        } else if (/^(featureBenefit|feesCharge|spendingRewards)$/.test(key)) {
            let val = Array.isArray(data[key]) ? data[key] : [data[key]];
            temp[key] = val.map(v => {
                let t = {}
                for (let k in v) {
                    if (m = k.match(/^(promotion|fee|rewards)([A-z]+)$/)) {
                        let ckey = m[2].toCamelCase();
                        if (ckey == "amount") {
                            for (let k2 in v[k]) {
                                t[k2] = v[k][k2];
                            }
                        } else {
                            t[ckey == "type" ? "name" : ckey] = v[k];
                        }
                    } else {
                        t[k] = v[k];
                    }
                }
                return t;
            })
        } else if (key == "services") {
            temp[key] = data[key].breakline()
            if (typeof temp[key] === "string") {
                temp[key] = temp[key].trimRightChar("。").breakline("，")
            }
        } else if (key == "moreInfo") {
            temp.remarks = "moreInfo" in data[key] ? data[key].moreInfo : data[key];
            if (Object.keys(temp.remarks).filter(v => v != "description").length == 0) {
                temp.remarks = temp.remarks.description;
            }
        } else if (key == "applicableAccounts") {
            temp[key] = data[key].map(v => v.accountType)
        } else if (key == "operatingHours") {
            temp.opening = cmn.StrToWeekTime(data[key])
        } else if (key == "productId") {
            temp._id = data[key];
        } else if (!/language|Id|productType|illustration/.test(key)) {
            let val = data[key];
            temp[key] = val;
        }
    }

    if ("coordinate" in temp) {
        temp.coordinate = new Coordinate(temp.coordinate);
    }
    if ("feesCharge" in temp) {
        let t = {};
        temp.feesCharge.map(v => {
            let name = v.name.toCamelCase();
            if (name == "membershipFee") name = "annualFee";
            else if (name == "latePaymentFee") name = "overdue";
            else if (name == "minimumBalanceCharge") name = "belowBalanceCharge";
            else if (name == "otherChrg") name = "others";

            t[name] = {}
            for (let key in v) {
                if (key != "name") {
                    t[name][key] = v[key];
                }
            }

        })
        temp.feesCharge = t;
    }
    return temp;
}

module.exports = {
    PreprocessFields,
    ParseItem,
}