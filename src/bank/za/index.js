// https://developer.bank.za.group/

const lib = require("../../lib/bank-za");
const bankInit = require("../init");
const Product = require("./product");

const ACCEPT_LANG = {
    en: "en",
    tc: "tw",
}

function init() {
    let BANK = {
        _type: "ZA",
        bank: false,
        production: false,
        code: "za"
    }
    BANK.setProduction = (state) => BANK.production = Boolean(state);
    BANK.init = (id, secret, lang, debug) => {
        return BANK.connect({
            id: id,
            secret: secret,
        }, lang, debug);
    }
    BANK.connect = (credential, lang, debug) => {
        return new Promise((resolve, reject) => {
            return reject("Currently not implemented");

            let { } = credential || {};
            if (BANK.bank) return resolve()
            lang = lang || "en";
            BANK.lang = lang;

            BANK.bank = bankInit(BANK._type, {
                production: BANK.production,
                debug,
            });
            return BANK.bank ? resolve("Bank initiation success") : reject(`No configuration found for bank code "${BANK._type}"`);
        })
    }
    BANK.search = (target, queryData) => {
        queryData = queryData || {};

        return new Promise((resolve, reject) => {
            if (BANK.bank == false) {
                reject("Require initiation first")
            } else {
                if (!("lang" in queryData)) queryData.lang = ACCEPT_LANG[BANK.lang];

                BANK.bank.Request(target, queryData)
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
    data = lib.PreprocessFields(data);
    switch (target) {
        case "saving":
        case "timeDeposit":
        case "loan":
        case "loanRate":
            result = Product(data, target);
            break;
    }
    return result;
}

module.exports = init;