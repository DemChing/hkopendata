// https://axess.sc.com/apis?region=asia&market=hk

const lib = require("../../lib/bank-sc");
const bankInit = require("../init");
const Facility = require("./facility");
const Fx = require("./fx");
const Product = require("./product");

function init() {
    let BANK = {
        _type: "SC",
        bank: false,
        production: false,
        code: "sc"
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
            let {
                id,
                secret
            } = credential || {};
            if (BANK.bank) return resolve()
            if (!id || !secret) return reject("Missing ID or secret");
            lang = lang || "en";

            BANK.bank = bankInit(BANK._type, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                production: BANK.production,
                debug,
            });

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
        return new Promise((resolve, reject) => {
            let data = lib.DataValidate(target, queryData);

            if (!data) {
                return reject("Incorrect queryData")
            }
            if (BANK.bank == false) {
                reject("Require initiation first")
            } else {
                BANK.bank.Request(target, {
                        data
                    })
                    .then((res) => {
                        resolve(processData(res, target))
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

function processData(data, target) {
    let result;
    data = lib.PreprocessFields(data, target);
    switch (target) {
        case "atm":
        case "branch":
            result = Facility(data);
            break;
        case "fx":
            result = Fx(data);
            break;
        case "saving":
        case "current":
        case "timeDeposit":
        case "creditCard":
        case "mortgage":
        case "loan":
        case "investment":
        case "insurance":
            result = Product(data, target);
            break;
    }
    return result;
}

module.exports = init;