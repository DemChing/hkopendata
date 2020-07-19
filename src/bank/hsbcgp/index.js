// https://developer.hsbc.com.hk/#/documentation
// https://developer.hangseng.com/#/documentation

const lib = require("../../lib/bank-hsbcgp");
const bankInit = require("../init");
const Account = require("./account");
const Facility = require("./facility");
const Fx = require("./fx");
const Loan = require("./loan");

const ACCEPT_LANG = {
    en: "en-HK",
    tc: "zh-HK",
    sc: "zh-CN"
}

function init(code) {
    let BANK = {
        _type: code.toUpperCase(),
        bank: false,
        code: code
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
                    "ClientID": id,
                    "ClientSecret": secret,
                    "Accept-Language": ACCEPT_LANG[lang]
                }
            });
            return BANK.bank ? resolve() : reject();
        })
    }
    BANK.search = (target, type) => {
        return new Promise((resolve, reject) => {
            if (BANK.bank == false) {
                reject("Require initiation first")
            } else {
                BANK.bank.Request(target, type)
                    .then((res) => {
                        resolve(processData(target, res))
                    })
                    .catch(err => reject(err))
            }
        })
    }
    return BANK;
}

function processData(target, data) {
    let result;
    data = lib.PreprocessFields(data).data;
    if ("website" in data) return data;
    switch (target) {
        case "timeDeposit":
            result = Account(data, "timeDeposit");
            break;
        case "saving":
        case "integrated":
            result = Account(data, "savingsAccount");
            break;
        case "current":
            result = Account(data, "currentAccount");
            break;
        case "foreignCurrency":
            result = Account(data, "foreignCurrencyAccount");
            break;
        case "atm":
            result = Facility(data, "atm");
            break;
        case "branch":
            result = Facility(data, "branch");
            break;
        case "fx":
            result = Fx(data);
            break;
        case "creditCard":
        case "commercialCard":
            result = Loan(data, "creditCard");
            break;
        case "securedLoan":
        case "securedLend":
            result = Loan(data, "securedLoan");
            break;
        case "unsecuredLoan":
        case "unsecuredLend":
            result = Loan(data, "unsecuredLoan");
            break;
        case "mortgage":
            result = Loan(data, "mortgage");
            break;
    }
    return result;
}

module.exports = init;