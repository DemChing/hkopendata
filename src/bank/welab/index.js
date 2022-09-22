// https://developers.welab.bank/

const lib = require("../../lib/bank-welab");
const bankInit = require("../init");
const Product = require("./product");

function init() {
    let BANK = {
        _type: "WELAB",
        bank: false,
        production: false,
        code: "welab"
    }
    BANK.setProduction = (state) => BANK.production = Boolean(state);
    BANK.init = (lang, debug) => {
        return BANK.connect({}, lang, debug);
    }
    BANK.connect = (credential, lang, debug) => {
        return new Promise((resolve, reject) => {
            let { } = credential || {};
            if (BANK.bank) return resolve()
            lang = lang || "en";

            BANK.bank = bankInit(BANK._type, {
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
                let _target = target;
                if (_target == "list") _target = "product";
                
                BANK.bank.Request(_target, queryData)
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
        case "list":
        case "product":
            result = Product(data, target);
            break;
    }
    return result;
}

module.exports = init;