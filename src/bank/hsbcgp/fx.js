const lib = require("../../lib/bank-hsbcgp");

function handle(data) {
    let result = [];
    data.map(v => {
        v.brand.map(b => {
            b.exchangeRateType.map(ert => {
                ert.exchangeRate.map(er => {
                    er.exchangeRateTierBand.map(t => {
                        let temp = {
                            brand: b.name,
                            type: ert.exchangeRateType,
                        }
                        if ("base" in er || "BaseCurrencyCode" in er) {
                            temp.baseCurrency = er.base;
                        }
                        temp = {
                            ...temp,
                            ...lib.ParseItem(t)
                        }
                        result.push(temp)
                    })
                })
            })

        })
    })
    return result;
}

module.exports = handle;