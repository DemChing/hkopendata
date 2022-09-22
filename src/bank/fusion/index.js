// https://developer.fusionbank.com/

const lib = require("../../lib/bank-fusion");
const bankInit = require("../init");
const Product = require("./product");

function init() {
    let BANK = {
        _type: "FUSION",
        bank: false,
        production: false,
        code: "fusion"
    }
    const Credential = {
        id: "",
        secret: ""
    };
    BANK.setProduction = (state) => BANK.production = Boolean(state);
    BANK.init = (id, secret, lang, debug) => {
        return BANK.connect({
            id: id,
            secret: secret,
        }, lang, debug);
    }
    BANK.connect = (credential, lang, debug) => {
        return new Promise((resolve, reject) => {
            let {
                id,
                secret
            } = credential || {};
            if (BANK.bank) return resolve()
            if (!id || !secret) return reject("Missing ID or secret");
            lang = lang || "en";

            Credential.id = id;
            Credential.secret = secret;

            BANK.bank = bankInit(BANK._type, {
                production: BANK.production,
                debug,
            });
            return BANK.bank ? resolve("Bank initiation success") : reject(`No configuration found for bank code "${BANK._type}"`);
        })
    }
    BANK.search = (target, queryData) => {
        return new Promise((resolve, reject) => {
            queryData = queryData || {}
            if (!("data" in queryData)) queryData.data = {}
            queryData.data = {
                clientId: Credential.id,
                clientSecret: Credential.secret,
                ...lib.ParseSearchFields(queryData.data),
            }

            if (BANK.bank == false) {
                reject("Require initiation first")
            } else {
                BANK.bank.Request(target, queryData)
                    .then((res) => {
                        if (!res.data) return reject(res);
                        resolve(processData(target, res.data))
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
        case "list":
            result = Product(data, target);
            break;
    }
    return result;
}

module.exports = init;