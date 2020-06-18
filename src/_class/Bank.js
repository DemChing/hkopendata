const axios = require("axios");
const qs = require("querystring");

class Bank {
    constructor(params) {
        this._id = params.id;
        this._endpoints = params.endpoints;
        this._instance = axios.create(params.instance);
        this._forceUUID = params.uuid || false;
    }

    APIRequest(endpoint, method, opts) {
        if (this._forceUUID) {
            this._instance.defaults.headers.common.uuid = uuid();
        }
        return new Promise((resolve, reject) => {
            this._instance[method](endpoint, opts)
                .then(res => {
                    resolve(res.data)
                })
                .catch(err => reject(err))
        })
    }

    Auth(params) {
        if (this._forceUUID) {
            this._instance.defaults.headers.common.uuid = uuid();
        }
        return new Promise((resolve, reject) => {
            this._instance.post(this._endpoints.auth, params)
                .then(res => resolve(res.data))
                .catch(err => reject(err))
        })
    }

    Request(target, params, method) {
        if (!method) method = "get";
        return new Promise((resolve, reject) => {
            if (target in this._endpoints) {
                let endpoint = this._endpoints[target],
                    data = {},
                    queries = "",
                    opts = {};
                if (params) {
                    if ("url" in params) {
                        for (let key in params.url) {
                            endpoint = endpoint.replace(`{${key}}`, params.url[key]);
                        }
                    }
                    if ("headers" in params) {
                        opts.headers = params.headers;
                    }
                    if (!/\{|\}/.test(endpoint)) {
                        endpoint = endpoint.replace(/\[|\]/g, "");
                    }
                    data = params.data || {};
                }

                if (Object.keys(data).length > 0) {
                    queries = `?${qs.stringify(data)}`;
                }
                endpoint = `${endpoint.split("[")[0]}${queries}`;
                this.APIRequest(endpoint, method, opts)
                    .then(res => resolve(res))
                    .catch(err => reject(err))
            } else {
                reject("Invalid Endpoint")
            }
        })
    }
}

function uuid() {
    let d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
        d += performance.now();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

module.exports = Bank;