const lib = require("../../lib/bank-za");

function handle(data, target) {
    return "products" in data ? data.products.map(temp => ({
        ...lib.ParseItem(temp),
    })) : "product" in data ? [lib.ParseItem(data.product)]
        : [lib.ParseItem(data)]
}

module.exports = handle;