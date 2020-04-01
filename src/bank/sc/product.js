const lib = require("../../lib/bank-sc");

function handle(data, type) {
    return lib.ParseItem(data[type])
}

module.exports = handle;