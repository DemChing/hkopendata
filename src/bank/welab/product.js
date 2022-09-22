const lib = require("../../lib/bank-welab");

function handle(data, target) {
    return target === "list" ? data.map(temp => ({
        ...lib.ParseItem(temp),
    })) : [lib.ParseItem(data)]
}

module.exports = handle;