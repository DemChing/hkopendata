// https://sandboxportal.apix.com.hk/jetco/sb/categories

const lib = require("../../lib/bank-jetco");
const bankInit = require("../init");
const Product = require("./product");

const ACCEPT_LANG = {
    en: "EN",
    tc: "HK",
    sc: "ZH"
}

function init(code) {
    let BANK = {
        _type: "JETCO",
        bank: false,
        code: code,
    }
    BANK.init = (id, secret, lang) => {
        return BANK.connect({
            id: id,
            secret: secret,
        }, lang);
    }
    BANK.connect = (credential, lang) => {
        return new Promise((resolve, reject) => {
            let {
                id,
                secret
            } = credential || {};
            if (BANK.bank) return resolve()
            if (!id || !secret) return reject("Missing ID or secret");
            lang = lang || "en";
            if (!(lang in ACCEPT_LANG)) lang = "en";

            BANK.bank = bankInit(BANK._type, {
                headers: {
                    "X-IBM-Client-Id": id,
                    "X-IBM-Client-Secret": secret,
                    "Accept-Language": ACCEPT_LANG[lang],
                }
            });
            return BANK.bank ? resolve() : reject();
        })
    }
    BANK.search = (target, queryData) => {
        return new Promise((resolve, reject) => {
            queryData = queryData || {};
            if (!("url" in queryData)) queryData.url = {}
            if (!("data" in queryData)) queryData.data = {}
            queryData.url.bank = code;

            if (BANK.bank == false) {
                reject("Require initiation first")
            } else if (!validEndpoint(code, target)) {
                reject("Invalid search type");
            } else {
                let split = target.split("-");
                target = split[0];
                if (split.length == 2) {
                    queryData.url.subtype = split[1];
                }
                BANK.bank.Request(target, queryData)
                    .then((res) => {
                        if (res.totalElements > res.pageSize * res.pageIdx) {
                            queryData.data = {
                                pageSize: res.totalElements
                            };
                            return BANK.search(target, queryData)
                        } else {
                            return processData(target, res)
                        }
                    })
                    .then(res => resolve(res))
                    .catch(err => reject(err))
            }
        })
    }
    return BANK;
}

function processData(target, data) {
    let result;
    data = lib.PreprocessFields(data);
    switch (target) {
        case "atm":
        case "branch":
        case "depositBox":
        case "mortgage":
        case "creditCard":
        case "insurance":
        case "investment":
            result = Product(data, target);
            break;
        case "saving":
        case "current":
        case "timeDeposit":
        case "foreignCurrency":
            result = Product(data, "deposit");
            break;
        case "fx":
            result = Product(data, "currencies");
            break;
        case "loan":
            result = Product(data, "unsecuredLoan");
            break;
    }
    return result;
}

function validEndpoint(bank, target) {
    let invalid = {
        "depositBox": ["ctn"],
        "foreignCurrency": ["cbi"],
        "insurance-accident": ["bea", "cbi", "pbl", "ctn"],
        "insurance-annuity": ["bea", "cbi", "pbl", "ctn"],
        "insurance-car": ["bea", "cbi", "fbb", "icb", "pbl", "wlb", "ctn"],
        "insurance-domestic": ["bea", "cbi", "fbb", "ctn"],
        "insurance-endowment": ["cbi", "pbl", "ctn"],
        "insurance-general": ["bea", "cbi", "chb", "fbb", "pbl", "ctn"],
        "insurance-home": ["bea", "cbi", "ctn"],
        "insurance-life": ["bea", "cbi", "pbl", "ctn"],
        "insurance-medical": ["bea", "cbi", "chb", "fbb", "pbl", "ctn"],
        "insurance-travel": ["cbi", "ctn"],
        "investment-fund": ["bea", "cbi", "pbl", "ctn"],
        "investment-structured": ["bea", "cbi", "icb", "pbl", "ctn"],
        "investment-stock": ["bea", "cbi", "ctn"],
        "investment-metal": ["bch", "bea", "cbi", "chb", "fbb", "icb", "pbl", "ctn"]
    }
    return !(target in invalid) || !(target in invalid && invalid[target].indexOf(bank) != -1);
}

module.exports = init;