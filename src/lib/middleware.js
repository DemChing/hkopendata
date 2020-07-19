module.exports = (request) => {
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
                if (!message) {
                    message = findMessage(err);
                }
            } else if (typeof err === "string") message = err;
            result.message = message || "Request Fail";
            reject(result);
        });
    });
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