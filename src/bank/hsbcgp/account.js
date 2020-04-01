const lib = require("../../lib/bank-hsbcgp");

function handle(data, type) {
    let result = [];
    data.map(v => {
        v.brand.map(b => {
            b[type].map(ac => {
                ac[type + "MarketingState"].map(s => {
                    let temp = {
                        brand: b.name,
                        name: ac.name,
                    }
                    if ("onSaleIndicator" in ac) {
                        temp.onsale = ac.onSaleIndicator;
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