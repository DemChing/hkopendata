const lib = require("../../lib/bank-sc");

function handle(data) {
    return lib.ParseItem(data.locations.map(v => {
        delete v.status
        return v;
    }))
}

module.exports = handle;