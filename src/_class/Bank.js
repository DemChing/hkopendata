const qs = require("querystring");
const utils = require("../utils");

class Bank {
    constructor(params) {
        this._id = params.id;
        this._endpoints = params.endpoints;
        this._debug = Boolean(params.debug);
        this._instanceOpts = params.instance;
        this._instance = this.CreateInstance();
        this._forceUUID = params.uuid || false;
        this._forceTimestamp = params.timestamp || false; // 1: in milliseconds, 1000: in seconds
    }

    CreateInstance() {
        return utils.CreateAxiosInstance(this._instanceOpts, this._debug);
    }

    SetDebug(debug) {
        this._debug = Boolean(debug);
        this._instance = this.CreateInstance();
    }

    SetInstanceOpts(params) {
        this._instanceOpts = params;
        this._instance = this.CreateInstance();
    }

    BeforeRequest() {
        if (this._forceUUID) {
            if (typeof this._forceUUID !== "string") this._forceUUID = "uuid";
            this._instance.defaults.headers.common[this._forceUUID] = uuid();
        }
        if (this._forceTimestamp) {
            if (typeof this._forceTimestamp !== "number") this._forceTimestamp = 1;
            this._instance.defaults.headers.common.timestamp = Date.now() / this._forceTimestamp;
        }
    }

    APIRequest(endpoint, method, opts) {
        this.BeforeRequest();
        return new Promise((resolve, reject) => {
            this._instance[method](endpoint, opts)
                .then(res => {
                    resolve(res.data)
                })
                .catch(err => reject(err))
        })
    }

    Auth(params) {
        this.BeforeRequest();
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