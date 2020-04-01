const lib = require("../../lib/bank-bochk");

function handle(data, lang) {
    let items = data.products;
    if (!items) items = data;
    return lib.ParseItem(items.filter(v => v.language == lang))
}

module.exports = handle;