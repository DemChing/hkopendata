// https://developer.antbank.hk/docs

const lib = require("../../lib/bank-ant");
const bankInit = require("../init");
const Product = require("./product");

function init() {
    let BANK = {
        _type: "ANT",
        bank: false,
        production: false,
        code: "ant"
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
            let {
                id,
                secret
            } = credential || {};
            if (BANK.bank) return resolve()
            if (!id || !secret) return reject("Missing ID or secret");
            lang = lang || "en";

            BANK.bank = bankInit(BANK._type, {
                headers: {
                    "Content-Type": "application/json"
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
    data = lib.PreprocessFields(data);
    switch (target) {
        case "saving":
            result = Product(data);
            break;
    }
    return result;
}

module.exports = init;