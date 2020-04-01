const cmn = require("../common");
const moment = require("../moment");
const Coordinate = require("../_class").Coordinate;

function PreprocessFields(data) {
    const FIELDS = {
        regex: {
            "product([a-z]{2,})$f-i": "$1",
            "suminsured": "sumInsured",
            "(yearly|annual)premium(hkd)?$": "annualPremium",
            "monthlypremium(hkd)?$": "monthlyPremium",
            "benefitpremium": "BenefitPremium",
            "premium(hkd)?$": "Premium",
            "(premium|insured)type": "$1Type",
            "additionalcardannual": "additionalCardAnnual",
            "foreigncurrencytxnfee": "foreignCurrencyTxnFee",
            "minrepaymentamt|paypercent": "minRepay",
            "^retailspending": "retailSpending",
            "^cashadvance": "cashAdvance",
            "retailspending": "RetailSpending",
            "cashadvance": "CashAdvance",
            "giftpoint": "giftPoint",
            "permile": "asiaMiles",
            "overduemincharge": "overdueminfeesCharge"
        },
        text: {
            "ATM": "atm",
            "Area": "region",
            "BankSell": "sellRate",
            "BankBuy": "buyRate",
            "LastUpdateTime": "lastUpdate",
            "ATMWithRMBWithdraw": "aTMwithRMB",
            "customerservicehotline": "tel",
            "investmentservicehotline": "tel",
            "Telephone": "tel",
            "BranchName": "name",
            "SecuritiesTrading": "securitiesServices",
            "SelfServiceBankingCentre": "automatedBankingCentre",
            "WealthManagementCentre": "wealthManagement",
            "InvestmentService": "investment",
            "ForeignCcyNoteReservation": "foreignCurrencyReservable",
            "ForeignBanknoteService": "foreignCurrencyAvailable",
            "BochkIService": "iservice",
            "EnrichBankingPriorityCounter": "priorityCounters",
            "CapitalInvestEntrantSchemeACService": "captialInvestment",
            "CorporateBankingCentre": "corporateCentre",
            "BusinessAccountOpeningBranch": "businessAccountOpening",
            "applicationchannel": "accessChannel",
            "applicationmethod": "accessChannel",
            "accountopenchannel": "accessChannel",
            "interestcalculationmethodology": "compoundingFrequency",
            "interestdepositfrequency": "interestFrequency",
            "fees": "serviceCharge",
            "servicefee": "serviceCharge",
            "feesofchequebooks": "chequeBookFee",
            "feesofreturnedcheques": "returnedChequeCharge",
            "earlyupliftfee": "earlyUpliftFee",
            "applicationappointmenturl": "urlAppoint",
            "eligibilityofapplicant": "eligibility",
            "remark": "remarks",
            "moreinfo": "remarks",
            "handlingfee": "handlingFee",
            "loanamount": "loanAmount",
            "annualisedpercentagerate": "repAPR",
            "annualizedinterestrate": "repAPR",
            "ratetableid": "rateId",
            "repaymentperiod": "loanTerm",
            "applicationformdownloadurl": "applyForm",
            "reminderandremark": "remarks",
            "cashrebates": "cashRebate",
            "targetcustomer": "customerType",
            "settlementdate": "settlementDate",
            "workprocedure": "procedure",
            "tenor": "investTenor",
            "principalamount": "principalAmount",
            "investmentamount": "principalAmount",
            "tradingchannel": "tradingChannel",
            "tradinghours": "tradingHour",
            "currencypair": "currencyPair",
            "ExchangeCode": "currencyPair",
            "referenceassettype": "referenceAsset",
            "investmentcurrency": "currency",
            "policycurrency": "currency",
            "premiumcurrency": "currency",
            "securitymarket": "securityMarket",
            "securitytrading": "securityTrading",
            "securitymargintrading": "securityMarginTrading",
            "monthlystocksavingplan": "monthlyStockSavingPlan",
            "iposubscription": "ipoSubscription",
            "ipofinancing": "ipoFinancing",
            "insurer": "insuranceCompany",
            "benefittype": "coverageType",
            "lang": "language",
            "basicplanenrollmentrequired": "standaloneBasis",
            "premiumpaymentperiod": "premiumPaymentPeriod",
            "coverageperiod": "coveragePeriod",
            "dayofinsurance": "coverageDay",
            "regioncountry": "coverageRegion",
            "statementavailability": "statement",
            "issuinginstitutions": "issuingInstitution",
            "cardimgurl": "cardimg",
            "YellowFormApplicationEndDate": "yellowFormEndDate"
        },
        number: {
            "interestfreerepaymentperiod": "maxInterestFreeDay",
        }
    }
    const FIELDS2 = {
        regex: {
            "^summary$$f-i": "description",
        },
        text: {
            "subtype": "subType",
            "instructions": "description",
            "shortdescription": "description",
            "leafleturl": "website",
            "fee": "serviceCharge",
            "cashAdvancehandlingfee": "cashAdvanceHandlingFee"
        },
    }

    if (Array.isArray(data)) {
        return data.map(v => PreprocessFields(v))
    } else if (typeof data === "object" && data !== null) {
        if (Object.keys(data) == 0) return data;
        let temp = {};
        data = cmn.RenameFields(data, FIELDS);
        data = cmn.RenameFields(data, FIELDS2);

        for (let key in data) {
            let ckey = key.toCamelCase();
            if (ckey != "metadata") {
                if (Array.isArray(data[key])) {
                    temp[ckey] = data[key].map(v => PreprocessFields(v));
                } else if (typeof data[key] === "object" || typeof data[key] === "string") {
                    temp[ckey] = PreprocessFields(data[key]);
                } else {
                    temp[ckey] = data[key]
                }
            }
        }
        return temp;
    } else if (typeof data === "string") {
        return data == "N/A" ? "" : data.replace(/''/g, "\"").trimRightChar("#").breakline();
    }
    return data;
}

function ParseItem(data) {
    if (typeof data !== "object" || data === null) return data;
    else if (Array.isArray(data)) return data.map(v => ParseItem(v));
    let temp = {};
    for (let key in data) {
        let m;
        if (/^(Y|N)$/.test(data[key])) {
            if (!("services" in temp)) temp.services = {};
            temp.services[key] = data[key] == "Y";
        } else if (/^(notice|rule)$/.test(key)) {
            if (!("safeDepositBoxTC" in temp)) temp.safeDepositBoxTC = [];
            temp.safeDepositBoxTC.push(data[key])
        } else if (/^(latitude|longitude)$/.test(key)) {
            if (!("coordinate" in temp)) temp.coordinate = {};
            temp.coordinate[key] = data[key];
        } else if (m = key.match(/^(retailSpending|cashAdvance)apr$/)) {
            if (!("loanInterest" in temp)) temp.loanInterest = {
                loanInterestTierBandSet: [{
                    tierBand: [{}]
                }]
            };
            if (!("repAPR" in temp.loanInterest.loanInterestTierBandSet[0].tierBand[0])) temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].repAPR = {};

            temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].repAPR[m[1]] = data[key];
        } else if (m = key.match(/^overdue(.+)$/)) {
            if (!("loanInterest" in temp)) temp.loanInterest = {
                loanInterestTierBandSet: [{
                    tierBand: [{}]
                }]
            };
            if (!("overdue" in temp.loanInterest.loanInterestTierBandSet[0].tierBand[0])) temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue = {};
            if (/^min/.test(m[1])) {
                let o, n = m[1].match(/^min(.+)/);
                if (o = n[1].match(/(.+)(hkd|rmb)/)) {
                    if (!(o[1] in temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue)) temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue[o[1]] = [];
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue[o[1]].push({
                        currency: o[2].toUpperCase(),
                        min: data[key].parseNumber()
                    });
                } else {
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue[n[1]] = data[key];
                }
            } else {
                let n;
                if (n = m[1].match(/(.+)apr/)) {
                    if (!("repAPR" in temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue)) temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue.repAPR = {};
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue.repAPR[n[1].toCamelCase()] = data[key];
                } else {
                    temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].overdue[m[1].toCamelCase()] = data[key];
                }
            }
        } else if (/(loanAmount|repAPR|rateId|cashRebate)$/.test(key)) {
            if (!("loanInterest" in temp)) temp.loanInterest = {
                loanInterestTierBandSet: [{
                    tierBand: [{}]
                }]
            };
            temp.loanInterest.loanInterestTierBandSet[0].tierBand[0][key] = data[key];
        } else if (m = key.match(/loanTerm$|^minRepay(hkd|rmb)/)) {
            if (!("loanInterest" in temp)) temp.loanInterest = {
                loanInterestTierBandSet: [{
                    tierBand: [{}]
                }]
            };
            if (!("referenceLoanRepayment" in temp.loanInterest.loanInterestTierBandSet[0].tierBand[0])) temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].referenceLoanRepayment = [{}]
            if (/minRepay/.test(key)) {
                if (!("minRepay" in temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].referenceLoanRepayment[0])) temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].referenceLoanRepayment[0].minRepay = [];
                temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].referenceLoanRepayment[0].minRepay.push({
                    currency: m[1].toUpperCase(),
                    amount: data[key].parseNumber()
                });
            } else {
                temp.loanInterest.loanInterestTierBandSet[0].tierBand[0].referenceLoanRepayment[0][key] = data[key];
            }
        } else if (m = key.match(/(enh|cruise)BenefitPremium$/)) {
            if (!("optionalBenefit" in temp)) temp.optionalBenefit = {};
            temp.optionalBenefit[`${m[1] == "enh" ? "enhance": m[1]}Benefit`] = data[key];
        } else if (/Frequency$/.test(key)) {
            if (!("creditInterest" in temp)) temp.creditInterest = {
                tierBand: [{}]
            };
            temp.creditInterest.tierBand[0][key] = data[key];
        } else if (m = key.match(/^(min)?(monthly|annual)?[Pp]remium$/)) {
            let c = `${m[2] ? m[2] : ""}Premium`.toCamelCase();
            if (!("feesCharge" in temp)) temp.feesCharge = {};
            if (!(c in temp.feesCharge)) temp.feesCharge[c] = {};
            temp.feesCharge[c][m[1] ? m[1] : "amount"] = data[key].parseNumber();
        } else if (m = key.match(/^card(name|type|id|img)$/)) {
            if (!("card" in temp)) temp.card = {};
            temp.card[m[1]] = data[key];
        } else if (m = key.match(/^scheme(name|class|id)$/)) {
            if (!("scheme" in temp)) temp.scheme = {};
            temp.scheme[m[1] == "id" ? `_${m[1]}` : m[1]] = data[key];
        } else if (m = key.match(/^stock(name|code)$/i)) {
            if (!("stock" in temp)) temp.stock = {};
            temp.stock[m[1].toCamelCase()] = data[key];
        } else if (m = key.match(/^class(name|id)$/)) {
            if (!("class" in temp)) temp.class = {};
            temp.class[m[1] == "id" ? `_${m[1]}` : m[1]] = data[key];
        } else if (m = key.match(/^(min)?(area|sumInsured|age)(fr|to)?$/)) {
            if (!(data[key] == "N/A" || data[key] == "")) {
                if (!(m[2] in temp)) temp[m[2]] = {};
                temp[m[2]][m[1] == "min" || m[3] == "fr" ? "min" : "max"] = data[key].parseNumber();
            }
        } else if (m = key.match(/(local|oversea|os)spending(giftPoint|cashback|asiaMiles)/)) {
            if (!("spendingRewards" in temp)) temp.spendingRewards = {};
            if (!(m[2] in temp.spendingRewards)) temp.spendingRewards[m[2]] = {};
            temp.spendingRewards[m[2]][m[1] == "os" ? "oversea" : m[1]] = data[key];
        } else if (m = key.match(/min(accopenbalance|agereq|balancereq|annualsalaryreq)/)) {
            let t;
            switch (m[1]) {
                case "accopenbalance":
                    t = "initialBalance";
                    break;
                case "agereq":
                    t = "age";
                    break;
                case "balancereq":
                    t = "balance";
                    break;
                case "annualsalaryreq":
                    t = "annualSalary";
                    break;
            }
            if (!("eligibility" in temp)) temp.eligibility = {};
            temp.eligibility[t] = {
                min: data[key].parseNumber(),
            };
        } else if (/(highlight(long)?|preferselected|promotionoffer|benefit\d)$/.test(key) || /^welcominggift/.test(key)) {
            if (!("featureBenefit" in temp)) temp.featureBenefit = [];
            let val = data[key],
                valid = true;
            if (Array.isArray(val)) {
                val = val.map(v => v.breakline()).filter(v => v.length != 0);
                if (val.length == 0) valid = false;
            } else if (typeof val === "string") {
                val = val.breakline();
                if (val.length == 0) valid = false;
            }
            if (valid) temp.featureBenefit.push(Array.isArray(val) ? val : [val]);
        } else if (/(Charge|Fee|commission)$/.test(key)) {
            if (!("feesCharge" in temp)) temp.feesCharge = {};
            if (/commission/.test(key)) {
                if (!("commissionFee" in temp.feesCharge)) temp.feesCharge.commissionFee = {}
                temp.feesCharge.commissionFee[/^min/.test(key) ? "min" : "amount"] = data[key].parseNumber();
            } else {
                temp.feesCharge[key] = Array.isArray(data[key]) ? data[key] : data[key].breakline();
            }
        } else if (m = key.match(/(.+)fee(hkd|rmb)$/)) {
            let fee = `${m[1]}Fee`;
            if (!("feesCharge" in temp)) temp.feesCharge = {};
            if (!(fee in temp.feesCharge)) temp.feesCharge[fee] = [];
            temp.feesCharge[fee].push({
                currency: m[2].toUpperCase(),
                amount: data[key].parseNumber()
            })
        } else if (m = key.match(/^openingHours(.+)/)) {
            if (!("opening" in temp)) temp.opening = {
                mon: false,
                tue: false,
                wed: false,
                thu: false,
                fri: false,
                sat: false,
                sun: false,
                ph: false,
            };
            if (/\d:\d+/.test(data[key])) {
                let times = data[key].match(/\d+:\d+/g)
                    .reduce((p, c, i, l) => p.concat(i % 2 == 0 ? [l.slice(i, i + 2)] : []), [])
                    .map(v => v.join("-"));
                if (m[1].indexOf("Sat") != -1) {
                    temp.opening.sat = times;
                } else if (m[1].indexOf("Mon") != -1) {
                    Object.keys(temp.opening).filter(v => !/sat|sun|ph/.test(v)).map(v => temp.opening[v] = times);
                } else {
                    temp.opening.sun = times;
                    temp.opening.ph = times;
                }
            }
        } else if (/(buy|sell)Rate/.test(key)) {
            temp[key] = data[key].parseNumber(2);
        } else if (/(tel|fax)/.test(key)) {
            let val = data[key];
            if (typeof val === "string") {
                val = val.match(/[0-9() +-]+/g);
                if (val.length == 1) val = val[1];
            }
            temp[key] = val;
        } else if (key == "yellowFormEndDate") {
            temp[key] = moment(data[key], "YYYY/MM/DD").format("YYYY-MM-DD")
        } else if (key == "lastUpdate") {
            temp[key] = moment(data[key], "YYYY/MM/DD HH:mm:ss").format("YYYY-MM-DD HH:mm:ss")
        } else if (!/hashtag|language|sortingid/.test(key)) {
            let val = data[key];
            if (typeof val === "string") {
                if (key == "currency") {
                    val = val.split(",").map(v => v.breakline());
                    if (val.length == 1) val = val[0];
                } else {
                    val = val.breakline();
                }
            }
            temp[key] = val;
        }
    }
    for (let key in temp) {
        if (key == "coordinate") {
            temp[key] = new Coordinate(temp[key]);
        }
    }
    return temp;
}

module.exports = {
    PreprocessFields,
    ParseItem,
}