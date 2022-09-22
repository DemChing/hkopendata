// https://openbankapiportal-vb.paob.com.hk

const lib = require("../../lib/bank-paob");
const bankInit = require("../init");
const Product = require("./product");

function init() {
    let BANK = {
        _type: "PAOB",
        bank: false,
        production: false,
        code: "paob"
    }
    BANK.setProduction = (state) => BANK.production = Boolean(state);
    BANK.init = (id, sign, lang, debug) => {
        return BANK.connect({
            id: id,
            sign: sign,
        }, lang, debug);
    }
    BANK.connect = (credential, lang, debug) => {
        return new Promise((resolve, reject) => {
            let {
                id,
                sign
            } = credential || {};
            if (BANK.bank) return resolve()
            if (!id) return reject("Missing app id");
            if (!sign) return reject("Missing signing function");
            lang = lang || "en";

            BANK.lang = lang;
            BANK.bank = bankInit(BANK._type, {
                headers: {
                    "appId": id,
                    "version": "1.0",
                    "Content-Type": "application/json"
                },
                transformRequest: (data, headers) => {
                    return sign(`${headers.common.requestId}${id}${headers.common.timestamp}${data ? JSON.stringify(data) : ''}`);
                },
                uuid: "requestId",
                timestamp: true,
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
                        resolve(processData(target, res, BANK.lang))
                    })
                    .catch(err => reject(err))
            }
        })
    }
    return BANK;
}

function processData(target, data, lang) {
    let result;
    data = lib.PreprocessFields(data.respData.respData);
    switch (target) {
        case "saving":
            result = Product(data, lang);
            break;
    }
    return result;
}

module.exports = init;