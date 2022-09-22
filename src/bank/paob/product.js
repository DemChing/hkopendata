const lib = require("../../lib/bank-paob");

function handle(data, lang) {
    data = lib.ParseItem(data);

    let item = {};
    for (let key in data) {
        let lang = "en";
        if (key.endsWith("CH")) lang = "sc";
        else if (key.endsWith("EN")) lang = "en";
        else if (key.endsWith("HK")) lang = "tc";
        item[lang] = lib.ParseItem(data[key]);
    }

    return [item[lang] || item.en];
}

module.exports = handle;