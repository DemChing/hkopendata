const lib = require("../../lib/bank-dbs");

function handle(data, lang) {
    return lib.ParseItem(data.filter(v => v.language == lang))
}

module.exports = handle;