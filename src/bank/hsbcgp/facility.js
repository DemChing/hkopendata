const lib = require("../../lib/bank-hsbcgp");

function handle(data, type) {
    let result = [];
    data.map(v => {
        v.brand.map(b => {
            b[type].map(t => {
                let temp = {
                    brand: b.name,
                }
                temp = {
                    ...temp,
                    ...lib.ParseItem(t)
                }
                result.push(temp)
            })
        })
    })
    return result;
}

module.exports = handle;