// https://www.dbs.com/dbsdevelopers/hk/discover/index.html

const lib = require("../../lib/bank-dbs");
const bankInit = require("../init");
const Product = require("./product");

const ACCEPT_LANG = {
    en: "en_US",
    tc: "zh_TW",
    sc: "zh_CN"
}

function init() {
    let BANK = {
        _type: "DBS",
        bank: false,
        production: false,
        code: "dbs",
    }
    BANK.setProduction = (state) => BANK.production = Boolean(state);
    BANK.init = (id, secret, app, jwt, lang, debug) => {
        return BANK.connect({
            id: id,
            secret: secret,
            app: app,
            jwt: jwt,
        }, lang, debug);
    }
    BANK.connect = (credential, lang, debug) => {
        return new Promise((resolve, reject) => {
            let {
                id,
                secret,
                app,
                jwt
            } = credential || {};
            if (BANK.bank) return resolve()
            if (!id || !secret || !app || !jwt) return reject("Missing ID, secret, app, or jwt");
            lang = lang || "en";
            if (!(lang in ACCEPT_LANG)) lang = "en";
            BANK._lang = ACCEPT_LANG[lang];

            BANK.bank = bankInit(BANK._type, {
                headers: {
                    Authorization: `Basic ${base64encode(`${id}:${secret}`)}`,
                    clientId: id,
                    servicingCountry: "HK",
                    "Content-Type": "application/json"
                },
                uuid: true,
                production: BANK.production,
                debug,
            });

            if (BANK.bank) {
                BANK.auth({
                        credentialDetl: {
                            partnerId: app,
                            partnerSecret: jwt
                        },
                        credentialType: 7
                    })
                    .then(res => {
                        BANK.bank._instance.defaults.headers.common.accessToken = res.accessToken;
                        return resolve("Bank initiation success");
                    })
                    .catch((err) => {
                        return reject(err);
                    });
            } else return reject();
        })
    }
    BANK.search = (target, queryData) => {
        queryData = queryData || {};

        return new Promise((resolve, reject) => {
            if (BANK.bank == false) {
                reject("Require initiation first")
            } else {
                BANK.bank.Request(target, queryData)
                    .then((res) => {
                        resolve(processData(res, target, BANK._lang))
                    })
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
    let keys = {
        branch: "branchInfo",
        atm: "ATMInfo",
        saving: "savingsAccountProductInfo",
        current: "currentAccountProductInfo",
        foreignCurrency: "foreignCurrencyAccountProductInfo",
        timeDeposit: "timeDepositProductInfo",
        mortgage: "mortgageProductInfo",
        creditCard: "creditCardProductInfo",
        unsecuredLoan: "unsecuredLoanProductInfo",
        securedLoan: "securedLoanProductInfo",
        fx: "exchangeRatesInfo"
    };

    if (target in keys) {
        if (keys[target] in data) {
            data = data[keys[target]];
        } else {
            // Temporary, should be removed when API is fixed
            if ("mortagageProductInfo" in data) {
                data = data.mortagageProductInfo;
            }
        }
    }
    return Product(lib.PreprocessFields(data), lang);
}

function base64encode(str) {
    if (typeof btoa !== "undefined") return btoa(str);
    if (typeof Buffer !== "undefined") return Buffer.from(str, 'binary').toString('base64');
    return str;
}

module.exports = init;