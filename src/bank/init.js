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
        domain,
        instance = {
            baseURL: "",
            headers: {
                ...params.headers
            }
        };
    if (CONFIG[org] && CONFIG[org].domain) {
        domain = CONFIG[org].domain;
    }
    if (!domain && bank && CONFIG[bank] && CONFIG[bank].domain) {
        domain = CONFIG[bank].domain;
    }
    if (typeof domain === "object") {
        instance.baseURL = domain[production ? "production" : "development"] ||
            domain.production ||
            domain.development;
    } else if (typeof domain === "string") {
        instance.baseURL = domain;
    }

    if (params.transformRequest) {
        instance.transformRequest = params.transformRequest;
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
        timestamp: params.timestamp || false,
        debug: Boolean(params.debug),
    })
}

module.exports = init