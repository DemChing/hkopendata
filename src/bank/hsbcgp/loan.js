const lib = require("../../lib/bank-hsbcgp");

function handle(data, type) {
    let result = [];
    data.map(v => {
        v.brand.map(b => {
            b[type].map(sl => {
                sl[type + "MarketingState"].map(s => {
                    let temp = {
                        brand: b.name,
                        name: sl.name,
                    };
                    if ("onSaleIndicator" in sl) {
                        temp.onsale = sl.onSaleIndicator;
                    }
                    temp = {
                        ...temp,
                        ...lib.ParseItem(s)
                    }
                    result.push(temp);
                })
            })
        })
    })
    return result;
}

module.exports = handle;