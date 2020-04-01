const lib = require("../../lib/bank-sc");

function handle(data) {
    return lib.ParseItem(data)
}

module.exports = handle;