const lib = require("../../lib/bank-livi");

function handle(data) {
    data = lib.ParseItem(data);

    let item = {},
        result = [];
    for (let key in data) {
        if (!/^list/.test(key)) {
            item[key] = data[key];
        } else {
            result.push(...data[key]);
        }
    }

    return result.map(temp => ({
        ...item,
        ...lib.ParseItem(temp),
    }))
}

module.exports = handle;