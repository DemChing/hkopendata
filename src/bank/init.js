const Bank = require("../_class/Bank");
const CONFIG = require("./config.json")

function init(org, params) {
    let bank;
    if (/BOCHK/.test(org)) {
        let m = org.match(/BOCHK-(.+)/);
        org = "BOCHK";
        bank = m[1].toUpperCase();
    }
    if (!org || !(org in CONFIG)) return false;
    params = params || {};
    let production = params.production || false,
        instance = {
            baseURL: "",
            headers: {
                ...params.headers
            }
        };
    if (typeof CONFIG[org].domain === "object") {
        instance.baseURL = CONFIG[org].domain[production ? "production" : "development"];
    } else if (typeof CONFIG[bank].domain !== "undefined") {
        instance.baseURL = CONFIG[bank].domain[production ? "production" : "development"];
    } else {
        instance.baseURL = CONFIG[org].domain;
    }

    let endpoints;
    if (org == "JETCO") {
        endpoints = {};
        for (let key in CONFIG[org].endpoints) {
            endpoints[key] = CONFIG[org].endpoints[key].replace("{path}", `${production ? "{bank}/api" : "jetco/sb"}/{bank}`);
        }
    } else {
        endpoints = CONFIG[org].endpoints;
    }
    return new Bank({
        id: org,
        instance: instance,
        endpoints: endpoints,
        uuid: params.uuid || false,
    })
}

module.exports = init