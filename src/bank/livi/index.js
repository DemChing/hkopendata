// https://developer.livibank.com/

const lib = require("../../lib/bank-livi");
const bankInit = require("../init");
const Product = require("./product");
const Interest = require("./interest");

function init() {
    let BANK = {
        _type: "LIVI",
        bank: false,
        production: false,
        code: "livi"
    }
    BANK.setProduction = (state) => BANK.production = Boolean(state);
    BANK.init = (secret, lang, debug) => {
        return BANK.connect({
            secret: secret,
        }, lang, debug);
    }
    BANK.connect = (credential, lang, debug) => {
        return new Promise((resolve, reject) => {
            let {
                secret
            } = credential || {};
            if (BANK.bank) return resolve()
            if (!secret) return reject("Missing subscription key");
            lang = lang || "en";

            BANK.bank = bankInit(BANK._type, {
                headers: {
                    "Cache-Control": "no-cache",
                    "Ocp-Apim-Subscription-Key": secret,
                },
                production: BANK.production,
                debug,
            });
            return BANK.bank ? resolve("Bank initiation success") : reject(`No configuration found for bank code "${BANK._type}"`);
        })
    }
    BANK.search = (target, queryData) => {
        return new Promise((resolve, reject) => {
            if (BANK.bank == false) {
                reject("Require initiation first")
            } else {
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
    data = lib.PreprocessFields(data.data);
    switch (target) {
        case "saving":
            result = Product(data);
            break;
        case "interest":
            result = Interest(data);
            break;
    }
    return result;
}

module.exports = init;