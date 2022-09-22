const lib = require("../../lib/bank-ant");

function handle(data) {
    return data.tiers.map(temp => ({
        name: data.productName,
        ...lib.ParseItem(temp),
    }))
}

module.exports = handle;