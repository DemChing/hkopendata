const lib = require("../../lib/bank-jetco");

function handle(data, type) {
    let result = [];
    if (type in data) {
        data[type].map(v => {
            result.push(lib.ParseItem(v, type))
        })
    }
    return result;
}

module.exports = handle;