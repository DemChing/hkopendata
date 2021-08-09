const Middleware = (request) => {
    let result = {
        error: false
    };
    return new Promise((resolve, reject) => {
        request.then((res) => {
            if (typeof res === "object" && res["error"]) {
                result.error = true;
                result.message = res["message"] || "Something went wrong";
                reject(result);
            } else {
                result.data = res || "Request Success";
                resolve(result);
            }
        }).catch((err) => {
            result.error = true;
            let message = "";
            if (typeof err === "object") {
                if (err.response && err.response.data) {
                    message = findMessage(err.response.data);
                }
                if (!message && err.response) {
                    if (err.response.status && err.response.status != 200) {
                        message = `Error ${err.response.status}: ${err.response.statusText}`
                    }
                }
                if (!message && err.error && err.message) message = err.message;
                if (!message) {
                    message = findMessage(err);
                }
            } else if (typeof err === "string") message = err;
            result.message = message || "Request Fail";
            reject(result);
        });
    });
}

Middleware.init = (type) => {
    if (typeof type !== "string" || !/^(bank|gov|org)$/.test(type)) throw "Invalid Middleware configuration";
    const Config = require(`../${type}`);
    const Handler = (config) => {
        let local = {};
        for (let key in config) {
            if (typeof config[key] === "object") {
                local[key] = Handler(config[key]);
            } else if (typeof config[key] === "function") {
                local[key] = (...args) => Middleware(config[key](...args));
            } else {
                local[key] = config[key];
            }
        }
        return local;
    }

    return Handler(Config);
}

function findMessage(obj) {
    let message = "";
    if (typeof obj === "object") {
        for (let key in obj) {
            if (message) continue;
            if (/message|error/i.test(key)) {
                if (typeof obj[key] === "object") {
                    let val = obj[key],
                        keys = Object.keys(val).filter(v => /message|text|value/i.test(v));
                    while (typeof val === "object" && keys.length > 0) {
                        val = val[keys[0]];
                        keys = Object.keys(val).filter(v => /message|text|value/i.test(v));
                    }
                    if (typeof val === "string") message = val;
                } else message = obj[key];
            } else message = findMessage(obj[key]);
        }
    }
    return message;
}

module.exports = Middleware;