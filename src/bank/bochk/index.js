// https://apidev.chiyubank.com/API_index.html
// https://api.bochk.com/API_index.html
// https://developer.ncb.com.hk/API_index.html

const lib = require("../../lib/bank-bochk");
const bankInit = require("../init");
const Product = require("./products");

const ACCEPT_LANG = {
    en: "en-US",
    tc: "zh-TW",
    sc: "zh-CN"
}

function init(code) {
    let BANK = {
        _type: "BOCHK",
        bank: false,
        code: code
    }
    BANK.init = (id, secret, lang) => {
        return new Promise((resolve, reject) => {
            if (BANK.bank) return resolve()
            if (!id || !secret) return reject();
            lang = lang || "en";
            if (!(lang in ACCEPT_LANG)) lang = "en";
            BANK._lang = ACCEPT_LANG[lang];

            BANK.bank = bankInit(`${BANK._type}-${code}`);

            if (BANK.bank) {
                BANK.auth(`client_id=${id}&client_secret=${secret}&grant_type=client_credentials`)
                    .then(res => {
                        BANK.bank._instance.defaults.headers.common.Authorization = `${res.token_type} ${res.access_token}`
                        return resolve();
                    })
                    .catch((err) => {
                        return reject(err);
                    });
            } else return reject();
        })
    }
    BANK.search = (target, queryData) => {
        queryData = queryData || {};
        if (!("url" in queryData)) queryData.url = {}
        return new Promise((resolve, reject) => {
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
                BANK.bank.Request(target, queryData, "post")
                    .then((res) => resolve(processData(res, target, BANK._lang)))
                    .catch(err => reject(err))
            }
        })
    }
    BANK.auth = (params) => {
        return BANK.bank.Auth(params)
    }
    return BANK;
}

function processData(data, target, lang) {
    data = lib.PreprocessFields(data, target);
    return Product(data, lang);
}

function validEndpoint(bank, target) {
    let invalid = {
        "loan-tax": ["chiyu"],
        "creditCard": ["chiyu", "ncb"],
        "insurance-life": ["chiyu"],
        "insurance-motor": ["chiyu"],
        "insurance-home": ["chiyu"],
        "insurance-travel": ["chiyu"],
        "insurance-medical": ["chiyu"],
        "fx-usdrate": ["chiyu"],
        "investment-currencylinked": ["ncb"],
        "investment-equitylinked": ["chiyu", "ncb"],
        "investment-metalpassbook": ["chiyu"],
        "investment-structuredinv": ["chiyu"],
        "investment-fx": ["chiyu", "ncb"],
        "investment-metalfxmargin": ["ncb"],
        "investment-physicalmetal": ["chiyu", "ncb"],
        "security-margin": ["ncb"],
        "security-mthlySavingPlan": ["ncb"],
    }
    return !(target in invalid) || !(target in invalid && invalid[target].indexOf(bank) != -1);
}

module.exports = init;

/*
loan-ploan
loan-tax
investment-currencylinked
investment-equitylinked
investment-metalpassbook
investment-structuredinv
security-trading
insurance-life
insurance-motor
insurance-home
insurance-home/premium
insurance-travel
insurance-travel/premium
insurance-medical
insurance-medical/premium
insurance-personalaccident/premium
fx-hkdnoterate
creditCard
*/

/*
investment-fx
investment-bond
investment-metalfxmargin
investment-physicalmetal
security-margin
security-mthlySavingPlan
fx-hkdrate
fx-usdrate
*/